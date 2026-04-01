import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const CHECKKO_KEY = process.env.CHECKKO_API_KEY;
const BASE = "https://api.checko.ru/v2";

async function checkkoGet(endpoint, inn) {
  const url = `${BASE}${endpoint}?key=${CHECKKO_KEY}&inn=${inn}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.meta?.status === "ok") return data.data;
    console.log(`  ⚠ ${endpoint}: ${data.meta?.message || "no data"}`);
    return null;
  } catch (err) {
    console.log(`  ✗ ${endpoint}: ${err.message}`);
    return null;
  }
}

async function enrichStudio(studio) {
  console.log(`→ ${studio.name} (ИНН: ${studio.inn})`);

  // Company info
  const company = await checkkoGet("/company", studio.inn);
  await new Promise((r) => setTimeout(r, 1000));

  // Finances
  const finances = await checkkoGet("/finances", studio.inn);
  await new Promise((r) => setTimeout(r, 1000));

  // Court cases
  const legalCases = await checkkoGet("/legal-cases", studio.inn);
  await new Promise((r) => setTimeout(r, 1000));

  // Contracts
  const contracts = await checkkoGet("/contracts", studio.inn);
  await new Promise((r) => setTimeout(r, 1000));

  // Enforcements
  const enforcements = await checkkoGet("/enforcements", studio.inn);
  await new Promise((r) => setTimeout(r, 1000));

  // Extract latest finances
  const latestFinance = finances?.Документы?.[0] || finances?.[0] || null;
  const revenue = latestFinance?.Выручка || latestFinance?.revenue || null;
  const profit = latestFinance?.ЧистаяПрибыль || latestFinance?.net_profit || null;

  const companyData = {
    studioId: studio.id,
    ogrn: company?.ОГРН || company?.ogrn || null,
    fullName: company?.НаименованиеПолное || company?.full_name || null,
    address: company?.Адрес || company?.address || null,
    director: company?.Руководитель?.ФИО || company?.director?.name || null,
    registrationDate: company?.ДатаРегистрации || company?.registration_date || null,
    status: company?.Статус || company?.status || null,
    revenue: revenue ? String(revenue) : null,
    profit: profit ? String(profit) : null,
    employees: company?.КоличествоСотрудников || company?.employees_count || null,
    courtCasesCount: legalCases?.length || legalCases?.Всего || 0,
    courtCases: legalCases ? JSON.parse(JSON.stringify(legalCases)) : null,
    contractsCount: contracts?.length || contracts?.Всего || 0,
    contracts: contracts ? JSON.parse(JSON.stringify(contracts)) : null,
    enforcementsCount: enforcements?.length || enforcements?.Всего || 0,
    enforcements: enforcements ? JSON.parse(JSON.stringify(enforcements)) : null,
  };

  try {
    await prisma.companyData.upsert({
      where: { studioId: studio.id },
      create: companyData,
      update: { ...companyData, fetchedAt: new Date() },
    });
    console.log(`  ✓ saved: revenue=${revenue}, cases=${companyData.courtCasesCount}, contracts=${companyData.contractsCount}, enforcements=${companyData.enforcementsCount}`);
  } catch (err) {
    console.log(`  ✗ DB error: ${err.message}`);
  }
}

async function main() {
  const studios = await prisma.studio.findMany({
    where: { inn: { not: null } },
    include: { companyData: true },
  });

  const toEnrich = studios.filter((s) => !s.companyData);
  console.log(`\nОбогащение ${toEnrich.length} студий с ИНН через Чекко API...\n`);

  for (const studio of toEnrich) {
    await enrichStudio(studio);
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
