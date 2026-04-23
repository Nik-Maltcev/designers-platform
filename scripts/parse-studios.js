import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import fs from "fs";
import "dotenv/config";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const DS_KEY = process.env.DEEPSEEK_API_KEY;
const DS_URL = "https://api.deepseek.com/chat/completions";

const csvFile = fs.existsSync("all.csv") ? "all.csv" : "designer.csv";
const csvLines = fs.readFileSync(csvFile, "utf-8").split("\n").filter(l => l.trim());
const hasHeader = csvLines[0]?.includes("URL") || csvLines[0]?.includes("ИНН");
const dataLines = hasHeader ? csvLines.slice(1) : csvLines;

const entries = dataLines
  .map(l => { const [url, inn] = l.split(","); return { url: url?.trim(), inn: inn?.trim() && /^\d{10,12}$/.test(inn.trim()) ? inn.trim() : null }; })
  .filter(e => e.url)
  .filter((e, i, a) => a.findIndex(x => x.url === e.url) === i);

function normalizeUrl(url) { return url.startsWith("http") ? url : "https://" + url; }

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
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) || "");
    const images = await page.evaluate(() => {
      return [...document.querySelectorAll("img, [style*='background-image']")]
        .map(el => {
          if (el.tagName === "IMG") return { src: el.src || el.dataset?.src || el.dataset?.lazySrc || el.getAttribute("data-src") || "", w: el.naturalWidth || el.width || 0, h: el.naturalHeight || el.height || 0 };
          const bg = el.style.backgroundImage?.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || "";
          return { src: bg, w: 100, h: 100 };
        })
        .filter(i => i.src?.startsWith("http") && !i.src.includes("logo") && !i.src.includes("icon") && !i.src.includes(".svg") && !i.src.includes("favicon") && !i.src.includes("pixel") && !i.src.includes("1x1"))
        .sort((a, b) => (b.w * b.h) - (a.w * a.h))
        .map(i => i.src).filter((s, i, a) => a.indexOf(s) === i);
    });
    const links = await page.evaluate((baseHost) => {
      return [...document.querySelectorAll("a[href]")]
        .map(a => ({ href: a.href, text: a.innerText?.trim().slice(0, 100) || "" }))
        .filter(l => l.href.includes(baseHost) && !l.href.includes("#") && !l.href.includes("mailto:") && !l.href.includes("tel:"))
        .filter((l, i, a) => a.findIndex(x => x.href === l.href) === i);
    }, new URL(url).hostname);
    await ctx.close();
    return { text, images, links };
  } catch { await ctx.close(); return null; }
}

// --- DeepSeek ---
async function callDS(messages, attempt = 0) {
  try {
    const res = await fetch(DS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DS_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.3, max_tokens: 4000 }),
    });
    const data = await res.json();
    if (data.error) {
      if (attempt < 3 && (res.status === 429 || res.status === 503)) {
        await new Promise(r => setTimeout(r, 5000));
        return callDS(messages, attempt + 1);
      }
      throw new Error(data.error.message);
    }
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    if (attempt < 2 && (err.message?.includes("fetch") || err.message?.includes("ECONNRESET"))) {
      await new Promise(r => setTimeout(r, 3000));
      return callDS(messages, attempt + 1);
    }
    throw err;
  }
}

async function askAI(text, prompt) {
  try {
    const raw = await callDS([
      { role: "system", content: "Отвечай только валидным JSON без markdown." },
      { role: "user", content: prompt + "\n\n" + text },
    ]);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.log(`  ⚠ AI: ${err.message}`);
    return null;
  }
}

// --- Smart portfolio finder ---
async function findPortfolioUrl(baseUrl, mainLinks) {
  // 1. Try common paths first (fast, no AI)
  const commonPaths = ["/portfolio", "/projects", "/works", "/proekty", "/cases", "/raboty", "/nashi-raboty", "/nashi-proekty", "/galereya", "/gallery"];
  const base = baseUrl.replace(/\/+$/, "");
  for (const path of commonPaths) {
    const found = mainLinks.find(l => new URL(l.href).pathname.replace(/\/+$/, "") === path);
    if (found) return found.href;
  }

  // 2. Ask AI to find portfolio link from menu
  const linksText = mainLinks.slice(0, 50).map(l => `${l.text} → ${l.href}`).join("\n");
  const result = await askAI(linksText, `Это ссылки из меню сайта дизайн-студии ${baseUrl}. Найди ссылку на раздел с портфолио/проектами/работами. Верни JSON: {"url":"ссылка на портфолио или null"}`);
  if (result?.url) return result.url;

  // 3. Try common paths by fetching
  for (const path of commonPaths) {
    try {
      const res = await fetch(base + path, { method: "HEAD", redirect: "follow" });
      if (res.ok) return base + path;
    } catch {}
  }
  return null;
}

async function getLinksFromPage(url) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    // Scroll to load lazy content
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(800);
    }
    // Click tabs/filters
    const tabs = await page.$$('[role="tab"], .tabs button, .filter-btn, .category-btn');
    for (const tab of tabs.slice(0, 6)) {
      try { await tab.click(); await page.waitForTimeout(1000); } catch {}
    }
    const links = await page.evaluate((baseHost) => {
      return [...document.querySelectorAll("a[href]")]
        .map(a => a.href)
        .filter(h => h.includes(baseHost) && !h.includes("#") && !h.includes("mailto:") && !h.includes("tel:"))
        .filter((h, i, a) => a.indexOf(h) === i);
    }, new URL(url).hostname);
    await ctx.close();
    const skip = ["/blog", "/uslugi", "/service", "/contact", "/about", "/price", "/news", "/faq", "/login", "/cart", "/policy", "/vacancy", "/jobs", "/requisites", "/staff"];
    return links.filter(l => !skip.some(s => l.toLowerCase().includes(s)));
  } catch { await ctx.close(); return []; }
}

// --- Main studio processor ---
async function processStudio(url, csvInn) {
  const normalized = normalizeUrl(url);
  console.log(`→ ${normalized}${csvInn ? ` (ИНН: ${csvInn})` : ""}`);

  const existing = await prisma.studio.findFirst({ where: { website: normalized } });
  if (existing) { console.log(`  ✓ exists: ${existing.name}`); return; }

  const main = await getPage(normalized);
  if (!main) { console.log(`  ✗ failed to load`); return; }

  // Studio info
  const info = await askAI(main.text, `Сайт дизайн-студии. URL: ${normalized}. Верни JSON: {"name":"Название","description":"Описание 2-3 предложения","city":"Город","inn":"ИНН если есть","segment":"premium/medium-plus/medium","objectTypes":["Квартиры","Дома"],"services":["Дизайн-проект"]}`);
  if (!info?.name) { console.log(`  ✗ AI fail`); return; }

  // Find portfolio
  const portfolioUrl = await findPortfolioUrl(normalized, main.links);
  let projectLinks = [];

  if (portfolioUrl) {
    console.log(`  📂 Портфолио: ${new URL(portfolioUrl).pathname}`);
    projectLinks = await getLinksFromPage(portfolioUrl);

    // If few links — might be categories, go one level deeper
    if (projectLinks.length > 0 && projectLinks.length <= 10) {
      let deepLinks = [];
      for (const catUrl of projectLinks.slice(0, 8)) {
        const sub = await getLinksFromPage(catUrl);
        if (sub.length > 2) {
          console.log(`    ↳ ${sub.length} из ${new URL(catUrl).pathname}`);
          deepLinks.push(...sub);
        }
      }
      if (deepLinks.length > projectLinks.length) projectLinks = deepLinks;
    }
    console.log(`  📂 Ссылок на проекты: ${projectLinks.length}`);
  } else {
    console.log(`  ⚠ Портфолио не найдено`);
  }

  // Parse projects
  const projects = [];
  for (const link of projectLinks) {
    const pp = await getPage(link, 10000);
    if (!pp) continue;
    const pInfo = await askAI(pp.text.slice(0, 3000),
      `Страница проекта дизайн-студии. Верни JSON: {"title":"Название проекта","description":"1-2 предложения","year":"год или null","objectType":"тип или null","skip":false}. Если это НЕ страница конкретного проекта (а блог, услуги, категория, контакты) — {"skip":true}`);
    if (!pInfo || pInfo.skip) continue;
    const imgs = pp.images.filter(u => /\.(jpg|jpeg|png|webp)/i.test(u));
    if (imgs.length === 0) continue;
    projects.push({
      title: pInfo.title || `Проект ${projects.length + 1}`,
      description: pInfo.description || null,
      imageUrls: imgs.slice(0, 15),
      year: pInfo.year || null,
      objectType: pInfo.objectType || null,
    });
    await new Promise(r => setTimeout(r, 300));
  }

  // INN
  let inn = csvInn || info.inn || null;
  if (!inn) {
    const paths = ["/contacts", "/kontakty", "/about", "/rekvizity", "/policy"];
    for (const path of paths) {
      const p = await getPage(normalized.replace(/\/+$/, "") + path, 10000);
      if (!p) continue;
      const m = p.text.match(/ИНН[:\s]*(\d{10,12})/i);
      if (m) { inn = m[1]; console.log(`  📋 ИНН: ${inn}`); break; }
    }
  }

  // Save
  const baseSlug = slugify(info.name) || slugify(normalized.replace(/https?:\/\//, ""));
  let slug = baseSlug;
  if (await prisma.studio.findUnique({ where: { slug } })) slug = baseSlug + "-" + Date.now().toString(36);

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
    console.log(`  ✓ ${info.name} (${projects.length} проектов, ${projects.reduce((s, p) => s + p.imageUrls.length, 0)} фото)`);
  } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  browser = await chromium.launch({ headless: true });
  const limit = parseInt(process.env.PARSE_LIMIT) || entries.length;
  const toProcess = entries.slice(0, limit);
  console.log(`\nПарсинг ${toProcess.length} из ${entries.length} студий из ${csvFile}...\n`);
  for (let i = 0; i < toProcess.length; i++) {
    try { await processStudio(toProcess[i].url, toProcess[i].inn); }
    catch (err) { console.log(`  💥 ${err.message}`); }
    if ((i + 1) % 14 === 0) {
      console.log("\n⏳ Пауза 30 сек...\n");
      await new Promise(r => setTimeout(r, 30000));
    }
  }
  await browser.close();
  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
