import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import fs from "fs";
import "dotenv/config";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KIMI_KEY = process.env.MOONSHOT_API_KEY;
const KIMI_URL = "https://api.moonshot.ai/v1/chat/completions";
const KIMI_MODEL = "kimi-k2-0905-preview";

const urls = fs.readFileSync("designer.csv", "utf-8")
  .split("\n").map(u => u.trim()).filter(Boolean)
  .filter((u, i, a) => a.indexOf(u) === i);

function normalizeUrl(url) {
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80);
}

let browser;

async function getPage(url, timeout = 15000) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await page.waitForTimeout(2000); // let JS render
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) || "");
    const images = await page.evaluate(() => {
      return [...document.querySelectorAll("img")]
        .map(img => ({ src: img.src || img.dataset?.src || img.dataset?.lazySrc || "", w: img.naturalWidth || img.width || 0, h: img.naturalHeight || img.height || 0 }))
        .filter(i => i.src.startsWith("http") && !i.src.includes("logo") && !i.src.includes("icon") && !i.src.includes(".svg") && !i.src.includes("favicon") && !i.src.includes("pixel") && !i.src.includes("spacer"))
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

async function askAI(text, prompt) {
  try {
    const res = await fetch(KIMI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KIMI_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: "system", content: "Ты анализируешь сайты дизайн-студий. Всегда отвечай только валидным JSON без markdown." },
          { role: "user", content: prompt + "\n\n" + text },
        ],
        temperature: 1,
        max_tokens: 4000,
      }),
    });
    const data = await res.json();
    if (data.error) {
      if (data.error.type === "rate_limit_exceeded" || data.error.message?.includes("overloaded")) {
        console.log("  ⏳ AI busy, waiting 15s...");
        await new Promise(r => setTimeout(r, 15000));
        return askAI(text, prompt);
      }
      throw new Error(data.error.message);
    }
    const raw = data.choices?.[0]?.message?.content || "";
    return JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
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

async function processStudio(url) {
  const normalized = normalizeUrl(url);
  console.log(`→ ${normalized}`);

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

  // Find INN
  let inn = info.inn || null;
  if (!inn) {
    console.log(`  🔍 INN...`);
    inn = await fetchInn(normalized);
    if (inn) console.log(`  📋 INN: ${inn}`);
  }

  const slug = slugify(info.name) || slugify(normalized.replace(/https?:\/\//, ""));
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
  const limit = parseInt(process.env.PARSE_LIMIT) || urls.length;
  const toProcess = urls.slice(0, limit);
  console.log(`\nПарсинг ${toProcess.length} из ${urls.length} студий (Playwright)...\n`);
  for (let i = 0; i < toProcess.length; i++) {
    await processStudio(toProcess[i]);
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
