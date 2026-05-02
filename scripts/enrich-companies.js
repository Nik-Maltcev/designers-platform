/**
 * Обогащение ПОДРЯДЧИКОВ (Company): Checkko + DataNewton по каждой компании.
 * Приоритет: DataNewton. Сырые данные обоих источников сохраняются.
 * 
 * Запуск: node scripts/enrich-companies.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

const CHECKKO_KEYS = [process.env.CHECKKO_API_KEY, process.env.CHECKKO_API_KEY_2].filter(Boolean);
let checkkoKeyIndex = 0;
const CHECKKO_BASE = "https://api.checko.ru/v2";

const DN_KEY = process.env.DATANEWTON_API_KEY;
const DN_BASE = "https://api.datanewton.ru";

if (!CHECKKO_KEYS.length) { console.error("❌ CHECKKO_API_KEY не задан"); process.exit(1); }
if (!DN_KEY) { console.error("❌ DATANEWTON_API_KEY не задан"); process.exit(1); }

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ==================== CHECKKO ====================

async function checkkoApi(endpoint, inn) {
  const url = `${CHECKKO_BASE}${endpoint}?key=${CHECKKO_KEYS[checkkoKeyIndex]}&inn=${inn}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.meta?.status === 429 || data.meta?.message?.includes("лимит")) {
      if (checkkoKeyIndex < CHECKKO_KEYS.length - 1) {
        checkkoKeyIndex++;
        console.log(`  🔄 Checkko ключ ${checkkoKeyIndex + 1}`);
        return checkkoApi(endpoint, inn);
      }
      console.log(`  ⚠ Checkko: лимит на всех ключах`);
      return null;
    }
    if (data.data) return data.data;
    if (data.meta?.message) console.log(`  ⚠ ${endpoint}: ${data.meta.message}`);
    return null;
  } catch (err) {
    console.log(`  ✗ ${endpoint}: ${err.message}`);
    return null;
  }
}

async function enrichCheckko(inn) {
  console.log(`  📋 Checkko...`);

  const company = await checkkoApi("/company", inn);
  await sleep(1200);
  const finances = await checkkoApi("/finances", inn);
  await sleep(1200);
  const legalCases = await checkkoApi("/legal-cases", inn);
  await sleep(1200);
  const contracts = await checkkoApi("/contracts", inn);
  await sleep(1200);
  const enforcements = await checkkoApi("/enforcements", inn);
  await sleep(1200);
  const entrepreneur = await checkkoApi("/entrepreneur", inn);
  await sleep(1200);
  const inspections = await checkkoApi("/inspections", inn);
  await sleep(1200);
  const bankruptcyMsgs = await checkkoApi("/bankruptcy-messages", inn);
  await sleep(1200);
  const bank = await checkkoApi("/bank", inn);
  await sleep(1200);
  const fedresurs = await checkkoApi("/fedresurs", inn);
  await sleep(1200);

  const years = finances?.Документы || finances || [];
  const latest = Array.isArray(years) ? years[0] : null;
  const revenue = latest?.Выручка ?? latest?.["2110"] ?? null;
  const profit = latest?.ЧистаяПрибыль ?? latest?.["2400"] ?? null;

  const casesArr = legalCases?.Документы || (Array.isArray(legalCases) ? legalCases : []);
  const casesCount = legalCases?.Всего ?? casesArr.length ?? 0;
  const contractsArr = contracts?.Документы || (Array.isArray(contracts) ? contracts : []);
  const contractsCount = contracts?.Всего ?? contractsArr.length ?? 0;
  const enfArr = enforcements?.Документы || (Array.isArray(enforcements) ? enforcements : []);
  const enfCount = enforcements?.Всего ?? enfArr.length ?? 0;

  console.log(`  ✓ Checkko: ${company?.НаимСокр || "OK"} | выручка: ${revenue || "—"} | суды: ${casesCount} | контракты: ${contractsCount} | исп.пр.: ${enfCount}`);

  return {
    ogrn: company?.ОГРН || null,
    fullName: company?.НаимПолн || null,
    address: company?.ЮрАдрес?.АдресРФ || null,
    director: company?.Руководитель?.ФИО || null,
    registrationDate: company?.ДатаРег || null,
    status: company?.Статус?.Наим || null,
    revenue: revenue != null ? String(revenue) : null,
    profit: profit != null ? String(profit) : null,
    employees: company?.КолРаботworkers ?? company?.СЧР ?? null,
    courtCasesCount: casesCount,
    courtCases: casesArr.length > 0 ? casesArr.slice(0, 20) : null,
    contractsCount: contractsCount,
    contracts: contractsArr.length > 0 ? contractsArr.slice(0, 20) : null,
    enforcementsCount: enfCount,
    enforcements: enfArr.length > 0 ? enfArr.slice(0, 20) : null,
    raw: { company, finances, legalCases, contracts, enforcements, entrepreneur, inspections, bankruptcyMsgs, bank, fedresurs },
  };
}

// ==================== DATANEWTON ====================

async function dnPost(path, body, queryParams = "") {
  const url = `${DN_BASE}${path}?key=${DN_KEY}${queryParams}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.code && data.code >= 400) {
      console.log(`  ⚠ ${path}: ${data.message || data.code}`);
      return null;
    }
    return data;
  } catch (err) {
    console.log(`  ✗ ${path}: ${err.message}`);
    return null;
  }
}

async function enrichDataNewton(inn) {
  console.log(`  🔬 DataNewton...`);

  const suggest = await dnPost("/v1/suggestions", { search_query: inn, limit: 1 });
  const company = suggest?.data?.[0];
  const ogrn = company?.ogrn;
  console.log(`  ${company ? "✓" : "—"} suggestions (ОГРН: ${ogrn || "—"})`);
  await sleep(500);

  if (!ogrn) {
    console.log(`  ✗ ОГРН не найден в DataNewton`);
    return null;
  }

  const allData = { company };

  const vac = await dnPost("/v1/vacancies", { ogrn, limit: 20, offset: 0 });
  allData.vacancies = vac;
  await sleep(500);

  const prod = await dnPost("/v1/products", { ogrn, limit: 20, offset: 0 });
  allData.products = prod;
  await sleep(500);

  const arb = await dnPost("/v1/arbitration/batch-cases", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0");
  allData.arbitration = arb;
  await sleep(500);

  const contr = await dnPost("/v1/batchContracts", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0");
  allData.contracts = contr;
  await sleep(500);

  const leases = await dnPost("/v1/leases", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
  allData.leases = leases;
  await sleep(500);

  const changes = await dnPost("/v1/batchChanges", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
  allData.changes = changes;
  await sleep(500);

  const tax = await dnPost("/v1/taxpayerStatuses", { inn_list: [inn] });
  allData.taxpayer = tax;
  await sleep(500);

  console.log(`  ✓ DataNewton: вакансии: ${vac?.total_vacancies || 0} | арбитраж: ${arb?.data?.length || 0} | контракты: ${contr?.data?.length || 0}`);

  return {
    ogrn,
    fullName: company?.full_name || null,
    address: company?.legal_address || null,
    employees: company?.employees_count ?? null,
    foundedYear: company?.registration_date ? parseInt(company.registration_date.slice(0, 4)) : null,
    status: company?.active ? "Действует" : "Не действует",
    courtCasesCount: arb?.data?.length || 0,
    courtCases: arb?.data?.slice(0, 20) || null,
    contractsCount: contr?.data?.length || contr?.total || 0,
    contracts: contr?.data?.slice(0, 20) || null,
    raw: allData,
  };
}

// ==================== MAIN ====================

async function processCompany(comp) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`→ ${comp.name} (ИНН: ${comp.inn})`);

  const ck = await enrichCheckko(comp.inn);
  const dn = await enrichDataNewton(comp.inn);

  // Приоритет: DataNewton, fallback на Checkko, fallback на существующие данные
  try {
    await prisma.company.update({
      where: { id: comp.id },
      data: {
        ogrn: dn?.ogrn || ck?.ogrn || comp.ogrn || null,
        address: dn?.address || ck?.address || comp.address || null,
        revenue: ck?.revenue || comp.revenue || null,
        employees: dn?.employees ?? ck?.employees ?? comp.employees ?? null,
        foundedYear: dn?.foundedYear ?? comp.foundedYear ?? null,
        director: ck?.director || comp.director || null,
        registrationDate: ck?.registrationDate || comp.registrationDate || null,
        status: dn?.status || ck?.status || comp.status || null,
        profit: ck?.profit || comp.profit || null,
        courtCasesCount: dn?.courtCasesCount || ck?.courtCasesCount || 0,
        courtCases: dn?.courtCases || ck?.courtCases || null,
        contractsCount: dn?.contractsCount || ck?.contractsCount || 0,
        contracts: dn?.contracts || ck?.contracts || null,
        enforcementsCount: ck?.enforcementsCount || 0,
        enforcements: ck?.enforcements || null,
        rawCheckko: ck?.raw || null,
        rawDataNewton: dn?.raw || null,
        enrichedAt: new Date(),
      },
    });
    console.log(`  ✅ Сохранено (оба источника)`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const companies = await prisma.company.findMany({ where: { inn: { not: null } } });
  console.log(`\n🔍 Обогащение ${companies.length} подрядчиков (Checkko + DataNewton)...\n`);

  let done = 0;
  for (const comp of companies) {
    await processCompany(comp);
    done++;
    if (done % 10 === 0) console.log(`\n--- Обработано ${done}/${companies.length} ---\n`);
  }

  console.log(`\n${"━".repeat(40)}`);
  console.log(`✅ Готово! Обработано: ${done}/${companies.length}`);
  console.log(`${"━".repeat(40)}\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
