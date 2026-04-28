import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import fs from "fs";
import "dotenv/config";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const DS_KEY = process.env.DEEPSEEK_API_KEY;
const DS_URL = "https://api.deepseek.com/chat/completions";
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;
const CHECKKO_KEYS = [process.env.CHECKKO_API_KEY, process.env.CHECKKO_API_KEY_2].filter(Boolean);
let ckKeyIdx = 0;
const DN_KEY = process.env.DATANEWTON_API_KEY;

const lines = fs.readFileSync("mebel - mebel.csv", "utf-8").split("\n").filter(l => l.trim());
const entries = lines.slice(1)
  .map(l => { const m = l.match(/^(\d{10,12})\s*,?\s*(.*)/); if (!m) return null; let url = (m[2]||"").replace(/["\s]/g,"").split(";")[0].trim(); if (url && !url.startsWith("http")) url = "https://"+url; if (url === "https://-" || url === "http://-") url = null; return { inn: m[1], url }; })
  .filter(e => e?.inn)
  .filter((e, i, a) => a.findIndex(x => x.inn === e.inn) === i);

entries.sort((a, b) => (a.url ? 1 : 0) - (b.url ? 1 : 0));

function slugify(n) { const tr={"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"}; return n.toLowerCase().split("").map(c=>tr[c]||c).join("").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80); }

let browser;

async function getPage(url, timeout=12000) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) || "");
    const images = await page.evaluate(() => [...document.querySelectorAll("img")].map(el => ({ src: el.src||el.dataset?.src||"", w: el.naturalWidth||el.width||0, h: el.naturalHeight||el.height||0 })).filter(i => i.src?.startsWith("http") && !i.src.includes("logo") && !i.src.includes("icon") && !i.src.includes(".svg") && !i.src.includes("favicon")).sort((a,b) => (b.w*b.h)-(a.w*a.h)).map(i => i.src).filter((s,i,a) => a.indexOf(s)===i));
    const links = await page.evaluate((h) => [...document.querySelectorAll("a[href]")].map(a => ({href:a.href,text:a.innerText?.trim().slice(0,100)||""})).filter(l => l.href.includes(h) && !l.href.includes("#") && !l.href.includes("mailto:")).filter((l,i,a) => a.findIndex(x => x.href===l.href)===i), new URL(url).hostname);
    await ctx.close();
    return { text, images, links };
  } catch { await ctx.close(); return null; }
}

async function callDS(messages) {
  const res = await fetch(DS_URL, { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${DS_KEY}`}, body: JSON.stringify({model:"deepseek-chat",messages,temperature:0.3,max_tokens:3000}) });
  const d = await res.json(); if (d.error) throw new Error(d.error.message); return d.choices?.[0]?.message?.content||"";
}
async function askAI(text, prompt) {
  try { const r = await callDS([{role:"system",content:"Отвечай только валидным JSON без markdown."},{role:"user",content:prompt+"\n\n"+text}]); return JSON.parse(r.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim()); }
  catch(e) { console.log(`  ⚠ AI: ${e.message}`); return null; }
}

// --- Checkko ---
async function checkkoApi(endpoint, inn) {
  if (CHECKKO_KEYS.length === 0) return null;
  const url = `https://api.checko.ru/v2${endpoint}?key=${CHECKKO_KEYS[ckKeyIdx]}&inn=${inn}`;
  try {
    const res = await fetch(url); const d = await res.json();
    if (d.meta?.status === 429 || d.meta?.message?.includes("лимит")) {
      if (ckKeyIdx < CHECKKO_KEYS.length - 1) { ckKeyIdx++; return checkkoApi(endpoint, inn); }
      return null;
    }
    return d.data || null;
  } catch { return null; }
}

// --- DataNewton ---
async function dnPost(path, body, qp="") {
  try {
    const res = await fetch(`https://api.datanewton.ru${path}?key=${DN_KEY}${qp}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const d = await res.json(); return (d.code && d.code >= 400) ? null : d;
  } catch { return null; }
}

// --- Enrich with Checkko + DataNewton ---
async function enrichCompany(inn) {
  console.log("  📊 Обогащение...");
  const ck = {}; const dn = {};
  
  // Checkko
  ck.company = await checkkoApi("/company", inn); await new Promise(r=>setTimeout(r,500));
  ck.finances = await checkkoApi("/finances", inn); await new Promise(r=>setTimeout(r,500));
  ck.legalCases = await checkkoApi("/legal-cases", inn); await new Promise(r=>setTimeout(r,500));
  ck.enforcements = await checkkoApi("/enforcements", inn); await new Promise(r=>setTimeout(r,500));

  // DataNewton
  const suggest = await dnPost("/v1/suggestions", {search_query:inn,limit:1}); await new Promise(r=>setTimeout(r,300));
  dn.company = suggest?.data?.[0];
  const ogrn = dn.company?.ogrn;
  if (ogrn) {
    dn.arbitration = await dnPost("/v1/arbitration/batch-cases", {ogrn:[ogrn],limit:20,offset:0}, "&limit=20&offset=0"); await new Promise(r=>setTimeout(r,300));
  }

  const years = ck.finances?.Документы || (Array.isArray(ck.finances) ? ck.finances : []);
  const latest = years[0] || null;
  const casesArr = ck.legalCases?.Документы || (Array.isArray(ck.legalCases) ? ck.legalCases : []);
  const enfArr = ck.enforcements?.Документы || (Array.isArray(ck.enforcements) ? ck.enforcements : []);

  return {
    ogrn: ogrn || ck.company?.ОГРН || null,
    fullName: ck.company?.НаимПолн || dn.company?.full_name || null,
    address: ck.company?.ЮрАдрес?.АдресРФ || dn.company?.address || null,
    director: ck.company?.Руководитель?.ФИО || null,
    registrationDate: ck.company?.ДатаРег || dn.company?.establishment_date || null,
    status: ck.company?.Статус?.Наим || (dn.company?.active ? "Действует" : null),
    revenue: latest?.Выручка ?? latest?.["2110"] ?? null,
    profit: latest?.ЧистаяПрибыль ?? latest?.["2400"] ?? null,
    employees: ck.company?.СЧР ?? null,
    courtCasesCount: ck.legalCases?.Всего ?? casesArr.length ?? 0,
    enforcementsCount: ck.enforcements?.Всего ?? enfArr.length ?? 0,
    rawCheckko: ck, rawDataNewton: dn,
  };
}

// --- Brave Search reviews ---
async function braveSearch(query) {
  if (!BRAVE_KEY) return [];
  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&search_lang=ru`, { headers: {"Accept":"application/json","X-Subscription-Token":BRAVE_KEY} });
    if (!res.ok) return [];
    const d = await res.json();
    return (d.web?.results||[]).map(r => ({title:r.title,url:r.url,snippet:r.description||""}));
  } catch { return []; }
}

async function collectReviews(companyName) {
  if (!BRAVE_KEY || !DS_KEY) return null;
  const results = await braveSearch(`"${companyName}" отзывы`);
  if (results.length === 0) return null;
  
  const context = results.map((r,i) => `[${i+1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`).join("\n\n");
  try {
    const raw = await callDS([
      {role:"system",content:"Отвечай только валидным JSON."},
      {role:"user",content:`Проанализируй отзывы о компании "${companyName}".\n\nРЕЗУЛЬТАТЫ:\n${context}\n\nВерни JSON: {"summary":"резюме 2-3 предложения или null","tone":"positive/mixed/negative/null","avgRating":число или null,"sources":[{"platform":"название","url":"ссылка"}]}`}
    ]);
    return JSON.parse(raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim());
  } catch { return null; }
}

// --- Portfolio finder ---
async function findPortfolioUrl(baseUrl, mainLinks) {
  const paths = ["/portfolio","/projects","/works","/proekty","/cases","/galereya","/gallery","/catalog","/katalog","/nashi-raboty"];
  for (const p of paths) { const f = mainLinks.find(l => { try { return new URL(l.href).pathname.replace(/\/+$/,"")===p; } catch{return false;} }); if (f) return f.href; }
  const lt = mainLinks.slice(0,40).map(l=>`${l.text} → ${l.href}`).join("\n");
  const r = await askAI(lt, `Ссылки из меню сайта компании ${baseUrl}. Найди портфолио/проекты/работы. JSON: {"url":"ссылка или null"}`);
  return r?.url || null;
}

async function getLinksFromPage(url) {
  const ctx = await browser.newContext({ignoreHTTPSErrors:true}); const page = await ctx.newPage();
  try {
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:12000}); await page.waitForTimeout(1500);
    for(let i=0;i<3;i++){await page.evaluate(()=>window.scrollBy(0,window.innerHeight));await page.waitForTimeout(500);}
    const links = await page.evaluate((h)=>[...document.querySelectorAll("a[href]")].map(a=>a.href).filter(l=>l.includes(h)&&!l.includes("#")&&!l.includes("mailto:")).filter((l,i,a)=>a.indexOf(l)===i), new URL(url).hostname);
    await ctx.close();
    const skip=["/blog","/service","/contact","/about","/price","/news","/faq","/login","/cart","/policy","/dostavka","/oplata"];
    return links.filter(l=>!skip.some(s=>l.toLowerCase().includes(s)));
  } catch{await ctx.close();return[];}
}

// --- Main processor ---
async function processContractor(entry) {
  const {inn, url} = entry;
  console.log(`→ ${url||"без сайта"} (ИНН: ${inn})`);

  const existing = await prisma.company.findFirst({where:{inn}});
  if (existing) { console.log(`  ✓ exists: ${existing.name}`); return; }

  let name = `Компания ${inn}`, description = null, city = null, type = "contractor";
  let categories = [], objectTypes = [], segment = null, logoUrl = null;
  let projects = [];

  if (url) {
    const main = await getPage(url);
    if (main) {
      const info = await askAI(main.text, `Сайт компании. URL: ${url}. JSON: {"name":"Название","description":"Описание","city":"Город","type":"contractor/supplier","categories":["Мебель"],"segment":"premium/medium-plus/medium","isShop":true если это интернет-магазин мебели/каталог товаров, false если производство/студия с проектами}`);
      if (info?.name) { name=info.name; description=info.description; city=info.city; type=info.isShop?"supplier":(info.type==="supplier"?"supplier":"contractor"); categories=info.categories||[]; segment=info.segment; }

      // For furniture shops: no photos at all (no logo, no projects)
      // For other companies: grab logo and portfolio
      if (info?.isShop) {
        console.log("  🛒 Интернет-магазин мебели — пропускаем фото и проекты");
        logoUrl = null;
      } else {
      logoUrl = main.images[0] || null;
      const pUrl = await findPortfolioUrl(url, main.links);
      if (pUrl) {
        let pLinks = await getLinksFromPage(pUrl);
        if (pLinks.length>0 && pLinks.length<=10) { let dl=[]; for(const c of pLinks.slice(0,4)){const s=await getLinksFromPage(c);if(s.length>2)dl.push(...s);} if(dl.length>pLinks.length)pLinks=dl; }
        console.log(`  📂 ${pLinks.length} ссылок`);
        for (const link of pLinks.slice(0, 20)) {
          const pp = await getPage(link, 8000); if (!pp) continue;
          const pi = await askAI(pp.text.slice(0,2000), `Страница проекта компании. JSON: {"title":"Название","description":"1-2 предложения","skip":false}. Если НЕ проект — {"skip":true}`);
          if (!pi || pi.skip) continue;
          const imgs = pp.images.filter(u=>/\.(jpg|jpeg|png|webp)/i.test(u));
          if (imgs.length===0) continue;
          projects.push({ title:pi.title||`Проект ${projects.length+1}`, description:pi.description||null, imageUrls:imgs.slice(0,5) });
        }
      }
      }
    } else { console.log("  ⚠ Сайт недоступен"); }
  }

  // Save company
  const baseSlug = slugify(name) || `company-${inn}`;
  let slug = baseSlug;
  if (await prisma.company.findUnique({where:{slug}})) slug = baseSlug+"-"+Date.now().toString(36);

  try {
    const company = await prisma.company.create({
      data: { name, slug, inn, website:url||null, description, city, type, categories, objectTypes, segment, logoUrl, source:"parser", regions:[], materials:[] },
    });
    if (projects.length > 0) await prisma.project.createMany({ data: projects.map(p=>({...p, companyId:company.id})) });
    console.log(`  ✓ ${name} (${projects.length} проектов)`);

    // Enrich with Checkko + DataNewton
    const enrichData = await enrichCompany(inn);
    if (enrichData.revenue) enrichData.revenue = String(enrichData.revenue);
    if (enrichData.profit) enrichData.profit = String(enrichData.profit);
    await prisma.company.update({ where:{id:company.id}, data:{
      revenue: enrichData.revenue||null, employees: enrichData.employees||null, foundedYear: enrichData.registrationDate ? parseInt(enrichData.registrationDate) || null : null,
    }});

    // Reviews
    const reviews = await collectReviews(name);
    if (reviews?.summary) {
      console.log(`  📝 ${reviews.tone}: ${reviews.summary?.slice(0,100)}`);
      try {
        await prisma.companyReviewSummary.create({
          data: {
            companyId: company.id,
            summary: reviews.summary || null,
            tone: reviews.tone || null,
            avgRating: reviews.avgRating || null,
            sources: reviews.sources || null,
          },
        });
      } catch (revErr) { console.log(`  ⚠ Reviews DB: ${revErr.message}`); }
    }

  } catch(err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  browser = await chromium.launch({headless:true, args:["--disable-dev-shm-usage","--no-sandbox"]});
  const limit = parseInt(process.env.PARSE_LIMIT) || entries.length;
  const toProcess = entries.slice(0, limit);
  console.log(`\nПарсинг ${toProcess.length} из ${entries.length} подрядчиков...\n`);
  for (let i=0; i<toProcess.length; i++) {
    try { await processContractor(toProcess[i]); }
    catch(err) {
      console.log(`  💥 ${err.message}`);
      if (err.message?.includes("closed")||err.message?.includes("crashed")) {
        try{await browser.close();}catch{}
        browser = await chromium.launch({headless:true, args:["--disable-dev-shm-usage","--no-sandbox"]});
      }
    }
  }
  await browser.close();
  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
