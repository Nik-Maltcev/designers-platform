import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import fs from "fs";
import "dotenv/config";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KIMI_KEY = process.env.MOONSHOT_API_KEY;
const KIMI_URL = "https://api.moonshot.ai/v1/chat/completions";
const KIMI_MODEL = "kimi-k2-0905-preview";

const csvFile = fs.existsSync("all.csv") ? "all.csv" : "designer.csv";
const csvLines = fs.readFileSync(csvFile, "utf-8").split("\n").filter(l => l.trim());
const hasHeader = csvLines[0]?.includes("URL") || csvLines[0]?.includes("ИНН");
const dataLines = hasHeader ? csvLines.slice(1) : csvLines;

const entries = dataLines
  .map(l => {
    const parts = l.split(",");
    const url = parts[0]?.trim();
    const inn = parts[1]?.trim() || null;
    return { url, inn: inn && /^\d{10,12}$/.test(inn) ? inn : null };
  })
  .filter(e => e.url)
  .filter((e, i, a) => a.findIndex(x => x.url === e.url) === i);

function normalizeUrl(url) {
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}

function slugify(name) {
  const tr = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"};
  return name.toLowerCase().split("").map(c => tr[c] || c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

let browser;

async function getPage(url, timeout = 15000) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await page.waitForTimeout(2000);
    // Scroll to trigger lazy-loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) || "");
    const images = await page.evaluate(() => {
      return [...document.querySelectorAll("img, [style*='background-image']")]
        .map(el => {
          if (el.tagName === "IMG") {
            return { src: el.src || el.dataset?.src || el.dataset?.lazySrc || el.dataset?.original || el.getAttribute("data-src") || "", w: el.naturalWidth || el.width || 0, h: el.naturalHeight || el.height || 0 };
          }
          const bg = el.style.backgroundImage?.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || "";
          return { src: bg, w: 100, h: 100 };
        })
        .filter(i => i.src && i.src.startsWith("http") && !i.src.includes("logo") && !i.src.includes("icon") && !i.src.includes(".svg") && !i.src.includes("favicon") && !i.src.includes("pixel") && !i.src.includes("spacer") && !i.src.includes("1x1"))
        .sort((a, b) => (b.w * b.h) - (a.w * a.h))
        .map(i => i.src)
        .filter((s, i, a) => a.indexOf(s) === i);
    });
    const links = await page.evaluate((baseHost) => {
      return [...document.querySelectorAll("a[href]")]
        .map(a => a.href)
        .filter(h => h.includes(baseHost) && !h.includes("#") && !h.includes("mailto:") && !h.includes("tel:"))
        .filter((h, i, a) => a.indexOf(h) === i);
    }, new URL(url).hostname);
    await ctx.close();
    return { text, images, links };
  } catch {
    await ctx.close();
    return null;
  }
}

async function callLLM(url, key, model, messages, attempt = 0) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature: 1, max_tokens: 4000 }),
    });
    const data = await res.json();
    if (data.error) {
      if (attempt < 3 && (data.error.message?.includes("overloaded") || data.error.message?.includes("rate") || res.status === 429 || res.status === 503)) {
        console.log(`  ⏳ Retry ${attempt + 1}/3 in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        return callLLM(url, key, model, messages, attempt + 1);
      }
      throw new Error(data.error.message);
    }
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    if (attempt < 3 && err.message?.includes("fetch failed")) {
      console.log(`  ⏳ Network retry ${attempt + 1}/3...`);
      await new Promise(r => setTimeout(r, 3000));
      return callLLM(url, key, model, messages, attempt + 1);
    }
    throw err;
  }
}

async function askAI(text, prompt) {
  const messages = [
    { role: "system", content: "Ты анализируешь сайты дизайн-студий. Всегда отвечай только валидным JSON без markdown обёрток." },
    { role: "user", content: prompt + "\n\n" + text },
  ];
  try {
    const raw = await callLLM(KIMI_URL, KIMI_KEY, KIMI_MODEL, messages);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Retry with stricter prompt if JSON invalid
      const raw2 = await callLLM(KIMI_URL, KIMI_KEY, KIMI_MODEL, [
        ...messages,
        { role: "assistant", content: cleaned },
        { role: "user", content: "Это невалидный JSON. Исправь и верни только валидный JSON." },
      ]);
      return JSON.parse(raw2.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    }
  } catch (err) {
    console.log(`  ⚠ AI: ${err.message}`);
    return null;
  }
}

async function fetchInn(baseUrl) {
  const paths = ["/contacts", "/kontakty", "/about", "/rekvizity", "/policy", "/oferta"];
  for (const path of paths) {
    const page = await getPage(baseUrl.replace(/\/+$/, "") + path, 10000);
    if (!page) continue;
    const match = page.text.match(/ИНН[:\s]*(\d{10,12})/i);
    if (match) return match[1];
  }
  return null;
}

async function processStudio(url, csvInn) {
  const normalized = normalizeUrl(url);
  console.log(`→ ${normalized}${csvInn ? ` (ИНН: ${csvInn})` : ""}`);

  const existing = await prisma.studio.findFirst({ where: { website: normalized } });
  if (existing) { console.log(`  ✓ exists: ${existing.name}`); return; }

  const main = await getPage(normalized);
  if (!main) { console.log(`  ✗ failed`); return; }

  // Get studio info from Gemini
  const info = await askAI(main.text, `Сайт дизайн-студии. URL: ${normalized}. Верни JSON (без markdown):
{"name":"Название","description":"Описание 2-3 предложения","city":"Город","inn":"ИНН если есть","segment":"premium/medium-plus/medium","objectTypes":["Квартиры","Дома"],"services":["Дизайн-проект"]}`);
  if (!info?.name) { console.log(`  ✗ AI fail`); return; }

  // Find portfolio page and click all tabs
  const portfolioPaths = ["/portfolio", "/projects", "/works", "/proekty", "/cases", "/raboty"];
  let projectLinks = [];
  for (const path of portfolioPaths) {
    const fullUrl = normalized.replace(/\/+$/, "") + path;
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    try {
      await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);

      // Click tab-like elements to reveal hidden content
      const tabs = await page.$$('[role="tab"], [data-tab], .tabs button, .filter-btn, .category-btn, .portfolio-filter a, .portfolio-filter button');
      const maxTabs = Math.min(tabs.length, 6);
      for (let t = 0; t < maxTabs; t++) {
        try {
          await tabs[t].click();
          await page.waitForTimeout(1500);
        } catch { /* skip */ }
      }

      // Collect all links after clicking tabs
      const links = await page.evaluate((baseHost) => {
        return [...document.querySelectorAll("a[href]")]
          .map(a => a.href)
          .filter(h => h.includes(baseHost) && !h.includes("#") && !h.includes("mailto:") && !h.includes("tel:"))
          .filter((h, i, a) => a.indexOf(h) === i);
      }, new URL(fullUrl).hostname);

      const skip = ["/blog", "/uslugi", "/service", "/contact", "/about", "/price", "/news", "/faq", "/login", "/cart", "/policy"];
      projectLinks = links.filter(l => !skip.some(s => l.toLowerCase().includes(s))).slice(0, 40);
      await ctx.close();
      if (projectLinks.length > 3) {
        console.log(`  📂 ${projectLinks.length} projects from ${path} (tabs clicked)`);
        break;
      }
    } catch {
      await ctx.close();
    }
  }

  // Parse each project page
  const projects = [];
  for (const link of projectLinks) {
    const pp = await getPage(link, 10000);
    if (!pp) continue;
    const pInfo = await askAI(pp.text.slice(0, 3000),
      `Страница проекта дизайн-студии. Верни JSON: {"title":"Название","description":"1-2 предложения","year":"год","objectType":"тип","skip":false}. Если это НЕ проект (блог, услуги и т.д.) — {"skip":true}`);
    if (!pInfo || pInfo.skip) continue;
    projects.push({
      title: pInfo.title || `Проект ${projects.length + 1}`,
      description: pInfo.description || null,
      imageUrls: pp.images.filter(u => /\.(jpg|jpeg|png|webp)/i.test(u)).slice(0, 8),
      year: pInfo.year || null,
      objectType: pInfo.objectType || null,
    });
    await new Promise(r => setTimeout(r, 500));
  }

  // Fallback: use main page images as projects
  if (projects.length === 0 && main.images.length > 1) {
    for (let i = 0; i < Math.min(main.images.length, 10); i++) {
      projects.push({ title: `Проект ${i + 1}`, description: null, imageUrls: [main.images[i]], year: null, objectType: null });
    }
  }

  // Find INN — use CSV first, then AI, then scrape
  let inn = csvInn || info.inn || null;
  if (!inn) {
    console.log(`  🔍 INN...`);
    inn = await fetchInn(normalized);
    if (inn) console.log(`  📋 INN: ${inn}`);
  }

  const baseSlug = slugify(info.name) || slugify(normalized.replace(/https?:\/\//, ""));
  let slug = baseSlug;
  const existingSlug = await prisma.studio.findUnique({ where: { slug } });
  if (existingSlug) slug = baseSlug + "-" + Date.now().toString(36);

  try {
    await prisma.studio.create({
      data: {
        name: info.name, slug, website: normalized, inn,
        description: info.description || null, city: info.city || null,
        segment: info.segment || null, objectTypes: info.objectTypes || [],
        services: info.services || [], imageUrl: main.images[0] || null,
        projectCount: projects.length,
        projects: { create: projects },
      },
    });
    console.log(`  ✓ ${info.name} (${projects.length} projects, ${projects.reduce((s, p) => s + p.imageUrls.length, 0)} photos)`);
  } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  browser = await chromium.launch({ headless: true });
  const limit = parseInt(process.env.PARSE_LIMIT) || entries.length;
  const toProcess = entries.slice(0, limit);
  const withInn = toProcess.filter(e => e.inn).length;
  console.log(`\nПарсинг ${toProcess.length} из ${entries.length} студий (${withInn} с ИНН) из ${csvFile}...\n`);
  for (let i = 0; i < toProcess.length; i++) {
    try {
      await processStudio(toProcess[i].url, toProcess[i].inn);
    } catch (err) {
      console.log(`  💥 Crash: ${err.message}`);
    }
    if ((i + 1) % 14 === 0) {
      console.log("\n⏳ Пауза 60 сек...\n");
      await new Promise(r => setTimeout(r, 60000));
    }
  }
  await browser.close();
  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
