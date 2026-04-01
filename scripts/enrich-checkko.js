import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KEY = process.env.CHECKKO_API_KEY;
const BASE = "https://api.checko.ru/v2";

async function api(endpoint, inn) {
  const url = `${BASE}${endpoint}?key=${KEY}&inn=${inn}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.data) return data.data;
    if (data.meta?.message) console.log(`  ⚠ ${endpoint}: ${data.meta.message}`);
    return null;
  } catch (err) {
    console.log(`  ✗ ${endpoint}: ${err.message}`);
    return null;
  }
}

async function enrichStudio(studio) {
  console.log(`→ ${studio.name} (ИНН: ${studio.inn})`);

  const company = await api("/company", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const finances = await api("/finances", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const legalCases = await api("/legal-cases", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const contracts = await api("/contracts", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const enforcements = await api("/enforcements", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const entrepreneur = await api("/entrepreneur", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const inspections = await api("/inspections", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const bankruptcyMsgs = await api("/bankruptcy-messages", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const bank = await api("/bank", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  const fedresurs = await api("/fedresurs", studio.inn);
  await new Promise((r) => setTimeout(r, 1200));

  // Parse finances - array of yearly reports
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

  const companyData = {
    studioId: studio.id,
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
    rawCheckko: {
      company, finances, legalCases, contracts, enforcements,
      entrepreneur, inspections, bankruptcyMsgs, bank, fedresurs,
    },
  };

  try {
    await prisma.companyData.upsert({
      where: { studioId: studio.id },
      create: companyData,
      update: { ...companyData, fetchedAt: new Date() },
    });
    console.log(`  ✓ ${company?.НаимСокр || "OK"} | выручка: ${revenue || "—"} | суды: ${casesCount} | контракты: ${contractsCount} | исп.пр.: ${enfCount}`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const studios = await prisma.studio.findMany({
    where: { inn: { not: null } },
  });
  console.log(`\nОбогащение ${studios.length} студий через Чекко API...\n`);

  for (const studio of studios) {
    await enrichStudio(studio);
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
