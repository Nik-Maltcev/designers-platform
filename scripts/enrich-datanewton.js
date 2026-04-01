import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KEY = process.env.DATANEWTON_API_KEY;
const BASE = "https://api.datanewton.ru";

async function dnPost(path, body, queryParams = "") {
  const url = `${BASE}${path}?key=${KEY}${queryParams}`;
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

async function enrichStudio(studio) {
  console.log(`→ ${studio.name} (ИНН: ${studio.inn})`);
  const allData = {};

  // 1. Find company by INN to get OGRN
  const suggest = await dnPost("/v1/suggestions", { search_query: studio.inn, limit: 1 });
  const company = suggest?.data?.[0];
  const ogrn = company?.ogrn;
  allData.company = company;
  console.log(`  ${company ? "✓" : "—"} suggestions (ОГРН: ${ogrn || "—"})`);
  await new Promise((r) => setTimeout(r, 500));

  if (!ogrn) {
    console.log(`  ✗ ОГРН не найден, пропускаем`);
    return;
  }

  // 2. Vacancies
  const vac = await dnPost("/v1/vacancies", { ogrn, limit: 20, offset: 0 });
  allData.vacancies = vac;
  console.log(`  ${vac?.data ? "✓" : "—"} vacancies (${vac?.total_vacancies || 0})`);
  await new Promise((r) => setTimeout(r, 500));

  // 3. Products
  const prod = await dnPost("/v1/products", { ogrn, limit: 20, offset: 0 });
  allData.products = prod;
  console.log(`  ${prod?.data ? "✓" : "—"} products`);
  await new Promise((r) => setTimeout(r, 500));

  // 4. Arbitration cases
  const arb = await dnPost("/v1/arbitration/batch-cases", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0");
  allData.arbitration = arb;
  console.log(`  ${arb?.data ? "✓" : "—"} arbitration (${arb?.data?.length || 0} дел)`);
  await new Promise((r) => setTimeout(r, 500));

  // 5. Contracts
  const contr = await dnPost("/v1/batchContracts", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0");
  allData.contracts = contr;
  console.log(`  ${contr?.data ? "✓" : "—"} contracts`);
  await new Promise((r) => setTimeout(r, 500));

  // 6. Leases
  const leases = await dnPost("/v1/leases", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
  allData.leases = leases;
  console.log(`  ${leases?.data ? "✓" : "—"} leases`);
  await new Promise((r) => setTimeout(r, 500));

  // 7. Changes
  const changes = await dnPost("/v1/batchChanges", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
  allData.changes = changes;
  console.log(`  ${changes?.data ? "✓" : "—"} changes`);
  await new Promise((r) => setTimeout(r, 500));

  // 8. Taxpayer statuses
  const tax = await dnPost("/v1/taxpayerStatuses", { inn_list: [studio.inn] });
  allData.taxpayer = tax;
  console.log(`  ${tax?.data ? "✓" : "—"} taxpayer`);
  await new Promise((r) => setTimeout(r, 500));

  // Save
  try {
    const existing = await prisma.companyData.findUnique({ where: { studioId: studio.id } });
    const updateData = { rawDataNewton: allData, fetchedAt: new Date() };

    if (existing) {
      await prisma.companyData.update({ where: { studioId: studio.id }, data: updateData });
    } else {
      await prisma.companyData.create({
        data: {
          studioId: studio.id,
          ogrn: ogrn,
          fullName: company?.full_name || company?.short_name || null,
          address: company?.legal_address || null,
          status: company?.active ? "Действует" : "Не действует",
          courtCasesCount: arb?.data?.length || 0,
          courtCases: arb?.data?.slice(0, 20) || null,
          contractsCount: contr?.data?.length || contr?.total || 0,
          contracts: contr?.data?.slice(0, 20) || null,
          ...updateData,
        },
      });
    }
    console.log(`  ✅ saved`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const studios = await prisma.studio.findMany({ where: { inn: { not: null } } });
  console.log(`\nDataNewton: обогащение ${studios.length} студий...\n`);
  for (const studio of studios) {
    await enrichStudio(studio);
  }
  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
