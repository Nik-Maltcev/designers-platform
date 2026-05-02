/**
 * Обогащение ПОДРЯДЧИКОВ (Company) через Checkko API по ИНН.
 * 
 * Запуск: node scripts/enrich-checkko-companies.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KEYS = [process.env.CHECKKO_API_KEY, process.env.CHECKKO_API_KEY_2].filter(Boolean);
let keyIndex = 0;
const BASE = "https://api.checko.ru/v2";

if (!KEYS.length) { console.error("❌ CHECKKO_API_KEY не задан"); process.exit(1); }

async function api(endpoint, inn) {
  const url = `${BASE}${endpoint}?key=${KEYS[keyIndex]}&inn=${inn}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.meta?.status === 429 || data.meta?.message?.includes("лимит")) {
      if (keyIndex < KEYS.length - 1) {
        keyIndex++;
        console.log(`  🔄 Checkko ключ ${keyIndex + 1}`);
        return api(endpoint, inn);
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

async function enrichCompany(comp) {
  console.log(`→ ${comp.name} (ИНН: ${comp.inn})`);

  const company = await api("/company", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const finances = await api("/finances", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const legalCases = await api("/legal-cases", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const contracts = await api("/contracts", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const enforcements = await api("/enforcements", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const entrepreneur = await api("/entrepreneur", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const inspections = await api("/inspections", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const bankruptcyMsgs = await api("/bankruptcy-messages", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const bank = await api("/bank", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const fedresurs = await api("/fedresurs", comp.inn);
  await new Promise((r) => setTimeout(r, 1200));

  // Parse finances
  const years = finances?.Документы || finances || [];
  const latest = Array.isArray(years) ? years[0] : null;
  const revenue = latest?.Выручка ?? latest?.["2110"] ?? null;
  const profit = latest?.ЧистаяПрибыль ?? latest?.["2400"] ?? null;

  // Parse legal cases
  const casesArr = legalCases?.Документы || (Array.isArray(legalCases) ? legalCases : []);
  const casesCount = legalCases?.Всего ?? casesArr.length ?? 0;

  // Parse contracts
  const contractsArr = contracts?.Документы || (Array.isArray(contracts) ? contracts : []);
  const contractsCount = contracts?.Всего ?? contractsArr.length ?? 0;

  // Parse enforcements
  const enfArr = enforcements?.Документы || (Array.isArray(enforcements) ? enforcements : []);
  const enfCount = enforcements?.Всего ?? enfArr.length ?? 0;

  // Update Company fields
  const updateData = {
    ogrn: company?.ОГРН || comp.ogrn || null,
    address: company?.ЮрАдрес?.АдресРФ || comp.address || null,
    revenue: revenue != null ? String(revenue) : comp.revenue || null,
    employees: company?.КолРаботworkers ?? company?.СЧР ?? comp.employees ?? null,
  };

  try {
    await prisma.company.update({
      where: { id: comp.id },
      data: updateData,
    });

    console.log(`  ✓ ${company?.НаимСокр || "OK"} | выручка: ${revenue || "—"} | суды: ${casesCount} | контракты: ${contractsCount} | исп.пр.: ${enfCount}`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const companies = await prisma.company.findMany({
    where: { inn: { not: null } },
  });
  console.log(`\nОбогащение ${companies.length} подрядчиков через Checkko API...\n`);

  let done = 0;
  for (const comp of companies) {
    await enrichCompany(comp);
    done++;
    if (done % 10 === 0) console.log(`\n--- Обработано ${done}/${companies.length} ---\n`);
  }

  console.log(`\n✅ Готово! Обработано: ${done}`);
  await prisma.$disconnect();
}

main().catch(console.error);
