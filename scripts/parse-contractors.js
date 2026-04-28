import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import fs from "fs";
import "dotenv/config";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const DS_KEY = process.env.DEEPSEEK_API_KEY;
const DS_URL = "https://api.deepseek.com/chat/completions";

// Parse CSV: ИНН,Сайт
const lines = fs.readFileSync("mebel - mebel.csv", "utf-8").split("\n").filter(l => l.trim());
const entries = lines.slice(1) // skip header
  .map(l => {
    const match = l.match(/^(\d{10,12})\s*,?\s*(.*)/);
    if (!match) return null;
    const inn = match[1];
    let url = (match[2] || "").replace(/["\s]/g, "").split(";")[0].trim();
    if (url && !url.startsWith("http")) url = "https://" + url;
    return { inn, url: url || null };
  })
  .filter(e => e?.inn)
  .filter((e, i, a) => a.findIndex(x => x.inn === e.inn) === i);

// Sort: entries without URL first (fast), then with URL
entries.sort((a, b) => (a.url ? 1 : 0) - (b.url ? 1 : 0));

function slugify(name) {
  const tr = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"};
  return name.toLowerCase().split("").map(c => tr[c] || c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

let browser;

async function getPage(url, timeout = 12000) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) || "");
    const images = await page.evaluate(() => {
      return [...document.querySelectorAll("img")]
        .map(el => ({ src: el.src || el.dataset?.src || el.getAttribute("data-src") || "", w: el.naturalWidth || el.width || 0, h: el.naturalHeight || el.height || 0 }))
        .filter(i => i.src?.startsWith("http") && !i.src.includes("logo") && !i.src.includes("icon") && !i.src.includes(".svg") && !i.src.includes("favicon") && !i.src.includes("pixel"))
        .sort((a, b) => (b.w * b.h) - (a.w * a.h))
        .map(i => i.src).filter((s, i, a) => a.indexOf(s) === i);
    });
    const links = await page.evaluate((baseHost) => {
      return [...document.querySelectorAll("a[href]")]
        .map(a => ({ href: a.href, text: a.innerText?.trim().slice(0, 100) || "" }))
        .filter(l => l.href.includes(baseHost) && !l.href.includes("#") && !l.href.includes("mailto:"))
        .filter((l, i, a) => a.findIndex(x => x.href === l.href) === i);
    }, new URL(url).hostname);
    await ctx.close();
    return { text, images, links };
  } catch { await ctx.close(); return null; }
}

async function callDS(messages) {
  try {
    const res = await fetch(DS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DS_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.3, max_tokens: 3000 }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || "";
  } catch (err) { throw err; }
}

async function askAI(text, prompt) {
  try {
    const raw = await callDS([
      { role: "system", content: "Отвечай только валидным JSON без markdown." },
      { role: "user", content: prompt + "\n\n" + text },
    ]);
    return JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
  } catch (err) {
    console.log(`  ⚠ AI: ${err.message}`);
    return null;
  }
}

async function findPortfolioUrl(baseUrl, mainLinks) {
  const commonPaths = ["/portfolio", "/projects", "/works", "/proekty", "/cases", "/galereya", "/gallery", "/catalog", "/katalog", "/nashi-raboty", "/realizovannye-proekty"];
  for (const path of commonPaths) {
    const found = mainLinks.find(l => {
      try { return new URL(l.href).pathname.replace(/\/+$/, "") === path; } catch { return false; }
    });
    if (found) return found.href;
  }
  // AI fallback
  const linksText = mainLinks.slice(0, 40).map(l => `${l.text} → ${l.href}`).join("\n");
  const result = await askAI(linksText, `Ссылки из меню сайта мебельной компании/подрядчика ${baseUrl}. Найди ссылку на портфолио/проекты/реализованные работы/каталог готовых работ. Верни JSON: {"url":"ссылка или null"}`);
  return result?.url || null;
}

async function getLinksFromPage(url) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }
    const links = await page.evaluate((baseHost) => {
      return [...document.querySelectorAll("a[href]")]
        .map(a => a.href)
        .filter(h => h.includes(baseHost) && !h.includes("#") && !h.includes("mailto:"))
        .filter((h, i, a) => a.indexOf(h) === i);
    }, new URL(url).hostname);
    await ctx.close();
    const skip = ["/blog", "/service", "/contact", "/about", "/price", "/news", "/faq", "/login", "/cart", "/policy", "/vacancy", "/dostavka", "/oplata", "/garantiya"];
    return links.filter(l => !skip.some(s => l.toLowerCase().includes(s)));
  } catch { await ctx.close(); return []; }
}

async function processContractor(entry) {
  const { inn, url } = entry;
  console.log(`→ ${url || "без сайта"} (ИНН: ${inn})`);

  // Check existing
  const existing = await prisma.company.findFirst({ where: { inn } });
  if (existing) { console.log(`  ✓ exists: ${existing.name}`); return; }

  // No website — create from INN only
  if (!url) {
    const slug = `company-${inn}`;
    try {
      await prisma.company.create({
        data: { name: `Компания ${inn}`, slug, inn, type: "contractor", categories: [], objectTypes: [], regions: [], materials: [], source: "parser" },
      });
      console.log(`  ✓ Создана (без сайта)`);
    } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
    return;
  }

  const main = await getPage(url);
  if (!main) {
    // Site failed — still create entry
    const slug = slugify(url.replace(/https?:\/\/(www\.)?/, "").replace(/\/.*/, "")) || `company-${inn}`;
    try {
      await prisma.company.create({
        data: { name: url.replace(/https?:\/\/(www\.)?/, "").replace(/\/.*/, ""), slug, inn, website: url, type: "contractor", categories: [], objectTypes: [], regions: [], materials: [], source: "parser" },
      });
      console.log(`  ✓ Создана (сайт недоступен)`);
    } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
    return;
  }

  // Company info
  const info = await askAI(main.text, `Сайт мебельной компании/подрядчика. URL: ${url}. Верни JSON: {"name":"Название","description":"Описание 2-3 предложения","city":"Город","type":"contractor или supplier","categories":["Мебель","Кухни"],"objectTypes":["Квартиры","Дома"],"segment":"premium/medium-plus/medium"}`);
  if (!info?.name) { console.log(`  ✗ AI fail`); return; }

  // Find portfolio
  const portfolioUrl = await findPortfolioUrl(url, main.links);
  let projects = [];

  if (portfolioUrl) {
    console.log(`  📂 Портфолио: ${new URL(portfolioUrl).pathname}`);
    let projectLinks = await getLinksFromPage(portfolioUrl);

    // Deep crawl if few links
    if (projectLinks.length > 0 && projectLinks.length <= 10) {
      let deepLinks = [];
      for (const catUrl of projectLinks.slice(0, 4)) {
        const sub = await getLinksFromPage(catUrl);
        if (sub.length > 2) deepLinks.push(...sub);
      }
      if (deepLinks.length > projectLinks.length) projectLinks = deepLinks;
    }

    // Limit to 30 for speed, defer heavy ones
    const toProcess = projectLinks.slice(0, 30);
    console.log(`  📂 Ссылок: ${projectLinks.length}, обработаем: ${toProcess.length}`);

    for (const link of toProcess) {
      const pp = await getPage(link, 8000);
      if (!pp) continue;
      const pInfo = await askAI(pp.text.slice(0, 2000),
        `Страница проекта/работы мебельной компании. Верни JSON: {"title":"Название","description":"1-2 предложения","skip":false}. Если НЕ проект (блог, услуги, каталог товаров, контакты) — {"skip":true}`);
      if (!pInfo || pInfo.skip) continue;
      const imgs = pp.images.filter(u => /\.(jpg|jpeg|png|webp)/i.test(u));
      if (imgs.length === 0) continue;
      projects.push({
        title: pInfo.title || `Проект ${projects.length + 1}`,
        description: pInfo.description || null,
        imageUrls: imgs.slice(0, 5),
      });
      await new Promise(r => setTimeout(r, 200));
    }
  } else {
    console.log(`  ⚠ Портфолио не найдено`);
  }

  // Save
  const baseSlug = slugify(info.name) || slugify(url.replace(/https?:\/\/(www\.)?/, "").replace(/\/.*/, ""));
  let slug = baseSlug;
  if (await prisma.company.findUnique({ where: { slug } })) slug = baseSlug + "-" + Date.now().toString(36);

  try {
    const company = await prisma.company.create({
      data: {
        name: info.name, slug, inn, website: url,
        description: info.description || null,
        city: info.city || null,
        type: info.type === "supplier" ? "supplier" : "contractor",
        categories: info.categories || [],
        objectTypes: info.objectTypes || [],
        segment: info.segment || null,
        logoUrl: main.images[0] || null,
        source: "parser",
      },
    });

    // Create projects linked to company
    if (projects.length > 0) {
      await prisma.project.createMany({
        data: projects.map(p => ({ ...p, companyId: company.id })),
      });
    }

    console.log(`  ✓ ${info.name} (${projects.length} проектов, ${projects.reduce((s, p) => s + p.imageUrls.length, 0)} фото)`);
  } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const limit = parseInt(process.env.PARSE_LIMIT) || entries.length;
  const toProcess = entries.slice(0, limit);
  console.log(`\nПарсинг ${toProcess.length} из ${entries.length} подрядчиков...\n`);

  for (let i = 0; i < toProcess.length; i++) {
    try { await processContractor(toProcess[i]); }
    catch (err) {
      console.log(`  💥 ${err.message}`);
      if (err.message?.includes("closed") || err.message?.includes("crashed")) {
        console.log("  🔄 Перезапуск браузера...");
        try { await browser.close(); } catch {}
        browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
      }
    }
  }

  await browser.close();
  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
