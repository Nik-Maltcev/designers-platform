/**
 * Для студий с ИНН из all.csv:
 * 1. Создаём запись в БД (если нет)
 * 2. Запускаем обогащение через Checkko и DataNewton
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const DN_KEY = process.env.DATANEWTON_API_KEY;

function slugify(name) {
  const tr = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"};
  return name.toLowerCase().split("").map(c => tr[c] || c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

const CHECKKO_KEYS = [process.env.CHECKKO_API_KEY, process.env.CHECKKO_API_KEY_2].filter(Boolean);
let checkkoKeyIndex = 0;

function getCheckkoKey() {
  return CHECKKO_KEYS[checkkoKeyIndex];
}

function switchCheckkoKey() {
  if (checkkoKeyIndex < CHECKKO_KEYS.length - 1) {
    checkkoKeyIndex++;
    console.log(`  🔄 Переключение на Checkko ключ ${checkkoKeyIndex + 1}`);
    return true;
  }
  return false;
}

// --- Checkko API ---
async function checkkoApi(endpoint, inn) {
  const url = `https://api.checko.ru/v2${endpoint}?key=${getCheckkoKey()}&inn=${inn}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.meta?.status === 429 || data.meta?.message?.includes("лимит")) {
      if (switchCheckkoKey()) {
        return checkkoApi(endpoint, inn);
      }
      console.log(`  ⚠ Checkko: лимит исчерпан на всех ключах`);
      return null;
    }
    if (data.data) return data.data;
    return null;
  } catch { return null; }
}

// --- DataNewton API ---
async function dnPost(path, body, queryParams = "") {
  const url = `https://api.datanewton.ru${path}?key=${DN_KEY}${queryParams}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.code && data.code >= 400) return null;
    return data;
  } catch { return null; }
}

async function processStudio(url, inn) {
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  const domain = normalized.replace(/https?:\/\/(www\.)?/, "").replace(/\/.*/, "");
  console.log(`\n→ ${domain} (ИНН: ${inn})`);

  // Check if already exists
  let studio = await prisma.studio.findFirst({ where: { OR: [{ website: normalized }, { inn }] } });
  if (!studio) {
    const slug = slugify(domain) || `studio-${Date.now().toString(36)}`;
    const existingSlug = await prisma.studio.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;
    studio = await prisma.studio.create({
      data: { name: domain, slug: finalSlug, website: normalized, inn },
    });
    console.log(`  ✓ Создана запись: ${studio.name}`);
  } else {
    if (!studio.inn) {
      await prisma.studio.update({ where: { id: studio.id }, data: { inn } });
      console.log(`  ✓ ИНН обновлён`);
    } else {
      console.log(`  ✓ Уже есть`);
    }
  }

  // Check if already enriched
  const existing = await prisma.companyData.findUnique({ where: { studioId: studio.id } });
  if (existing?.rawCheckko && existing?.rawDataNewton) {
    console.log(`  ✓ Данные уже есть, пропускаем`);
    return;
  }

  // --- Checkko ---
  console.log("  Checkko...");
  const ckCompany = await checkkoApi("/company", inn); await new Promise(r => setTimeout(r, 1200));
  const ckFinances = await checkkoApi("/finances", inn); await new Promise(r => setTimeout(r, 1200));
  const ckLegalCases = await checkkoApi("/legal-cases", inn); await new Promise(r => setTimeout(r, 1200));
  const ckContracts = await checkkoApi("/contracts", inn); await new Promise(r => setTimeout(r, 1200));
  const ckEnforcements = await checkkoApi("/enforcements", inn); await new Promise(r => setTimeout(r, 1200));
  const ckEntrepreneur = await checkkoApi("/entrepreneur", inn); await new Promise(r => setTimeout(r, 1200));
  const ckInspections = await checkkoApi("/inspections", inn); await new Promise(r => setTimeout(r, 1200));
  const ckBankruptcy = await checkkoApi("/bankruptcy-messages", inn); await new Promise(r => setTimeout(r, 1200));
  const ckBank = await checkkoApi("/bank", inn); await new Promise(r => setTimeout(r, 1200));
  const ckFedresurs = await checkkoApi("/fedresurs", inn); await new Promise(r => setTimeout(r, 1200));

  const rawCheckko = { company: ckCompany, finances: ckFinances, legalCases: ckLegalCases, contracts: ckContracts, enforcements: ckEnforcements, entrepreneur: ckEntrepreneur, inspections: ckInspections, bankruptcyMsgs: ckBankruptcy, bank: ckBank, fedresurs: ckFedresurs };

  // Parse Checkko
  const years = ckFinances?.Документы || (Array.isArray(ckFinances) ? ckFinances : []);
  const latest = years[0] || null;
  const revenue = latest?.Выручка ?? latest?.["2110"] ?? null;
  const profit = latest?.ЧистаяПрибыль ?? latest?.["2400"] ?? null;
  const casesArr = ckLegalCases?.Документы || (Array.isArray(ckLegalCases) ? ckLegalCases : []);
  const contractsArr = ckContracts?.Документы || (Array.isArray(ckContracts) ? ckContracts : []);
  const enfArr = ckEnforcements?.Документы || (Array.isArray(ckEnforcements) ? ckEnforcements : []);

  // --- DataNewton ---
  console.log("  DataNewton...");
  const dnSuggest = await dnPost("/v1/suggestions", { search_query: inn, limit: 1 }); await new Promise(r => setTimeout(r, 500));
  const dnCompany = dnSuggest?.data?.[0];
  const ogrn = dnCompany?.ogrn;
  let rawDataNewton = { company: dnCompany };

  if (ogrn) {
    const vac = await dnPost("/v1/vacancies", { ogrn, limit: 20, offset: 0 }); await new Promise(r => setTimeout(r, 500));
    const prod = await dnPost("/v1/products", { ogrn, limit: 20, offset: 0 }); await new Promise(r => setTimeout(r, 500));
    const arb = await dnPost("/v1/arbitration/batch-cases", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0"); await new Promise(r => setTimeout(r, 500));
    const leases = await dnPost("/v1/leases", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0"); await new Promise(r => setTimeout(r, 500));
    const changes = await dnPost("/v1/batchChanges", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0"); await new Promise(r => setTimeout(r, 500));
    const tax = await dnPost("/v1/taxpayerStatuses", { inn_list: [inn] }); await new Promise(r => setTimeout(r, 500));
    rawDataNewton = { ...rawDataNewton, vacancies: vac, products: prod, arbitration: arb, leases, changes, taxpayer: tax };
  }

  // Save
  const companyData = {
    studioId: studio.id,
    ogrn: ogrn || ckCompany?.ОГРН || null,
    fullName: ckCompany?.НаимПолн || dnCompany?.full_name || null,
    address: ckCompany?.ЮрАдрес?.АдресРФ || dnCompany?.address || null,
    director: ckCompany?.Руководитель?.ФИО || null,
    registrationDate: ckCompany?.ДатаРег || dnCompany?.establishment_date || null,
    status: ckCompany?.Статус?.Наим || (dnCompany?.active ? "Действует" : null),
    revenue: revenue != null ? String(revenue) : null,
    profit: profit != null ? String(profit) : null,
    employees: ckCompany?.СЧР ?? null,
    courtCasesCount: ckLegalCases?.Всего ?? casesArr.length ?? 0,
    courtCases: casesArr.length > 0 ? casesArr.slice(0, 20) : null,
    contractsCount: ckContracts?.Всего ?? contractsArr.length ?? 0,
    contracts: contractsArr.length > 0 ? contractsArr.slice(0, 20) : null,
    enforcementsCount: ckEnforcements?.Всего ?? enfArr.length ?? 0,
    enforcements: enfArr.length > 0 ? enfArr.slice(0, 20) : null,
    rawCheckko, rawDataNewton,
  };

  try {
    if (existing) {
      await prisma.companyData.update({ where: { studioId: studio.id }, data: { ...companyData, fetchedAt: new Date() } });
    } else {
      await prisma.companyData.create({ data: companyData });
    }
    console.log(`  ✅ ${ckCompany?.НаимСокр || dnCompany?.name || "OK"} | выручка: ${revenue || "—"} | суды: ${casesArr.length} | арбитраж: ${rawDataNewton.arbitration?.data?.length || 0}`);
  } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  const lines = fs.readFileSync("all.csv", "utf-8").split("\n").slice(1).filter(l => l.trim());
  const withInn = lines
    .map(l => { const [url, inn] = l.split(","); return { url: url?.trim(), inn: inn?.trim() }; })
    .filter(r => r.url && r.inn && /^\d{10,12}$/.test(r.inn));

  console.log(`\n📊 Обогащение ${withInn.length} студий с ИНН из all.csv\n`);

  for (const { url, inn } of withInn) {
    await processStudio(url, inn);
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
