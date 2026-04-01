import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KEY = process.env.DATANEWTON_API_KEY;
const BASE = "https://api.datanewton.ru";

async function dnPost(path, body) {
  const url = `${BASE}${path}?key=${KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.code && data.code !== 200) {
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

  // Company card
  const cards = await dnPost("/v1/batchCards", { inn: [studio.inn], limit: 1 });
  allData.cards = cards;
  console.log(`  ${cards?.data ? "✓" : "—"} batchCards`);
  await new Promise((r) => setTimeout(r, 1200));

  // Contracts
  const contracts = await dnPost("/v1/batchContracts", { inn: [studio.inn], limit: 50 });
  allData.contracts = contracts;
  console.log(`  ${contracts?.data ? "✓" : "—"} batchContracts`);
  await new Promise((r) => setTimeout(r, 1200));

  // Arbitration cases
  const cases = await dnPost("/v1/arbitration/batch-cases", { inn: [studio.inn], limit: 50 });
  allData.arbitration = cases;
  console.log(`  ${cases?.data ? "✓" : "—"} arbitration`);
  await new Promise((r) => setTimeout(r, 1200));

  // Vacancies
  const vacancies = await dnPost("/v1/vacancies", { inn: studio.inn, limit: 20 });
  allData.vacancies = vacancies;
  console.log(`  ${vacancies?.data ? "✓" : "—"} vacancies`);
  await new Promise((r) => setTimeout(r, 1200));

  // Products (goods/services)
  const products = await dnPost("/v1/products", { inn: studio.inn, limit: 20 });
  allData.products = products;
  console.log(`  ${products?.data ? "✓" : "—"} products`);
  await new Promise((r) => setTimeout(r, 1200));

  // Leases
  const leases = await dnPost("/v1/leases", { inn: [studio.inn], limit: 20 });
  allData.leases = leases;
  console.log(`  ${leases?.data ? "✓" : "—"} leases`);
  await new Promise((r) => setTimeout(r, 1200));

  // Changes (company changes history)
  const changes = await dnPost("/v1/batchChanges", { inn: [studio.inn], limit: 20 });
  allData.changes = changes;
  console.log(`  ${changes?.data ? "✓" : "—"} batchChanges`);
  await new Promise((r) => setTimeout(r, 1200));

  // Taxpayer statuses
  const taxpayer = await dnPost("/v1/taxpayerStatuses", { inn: [studio.inn] });
  allData.taxpayer = taxpayer;
  console.log(`  ${taxpayer?.data ? "✓" : "—"} taxpayerStatuses`);
  await new Promise((r) => setTimeout(r, 1200));

  // Save to DB
  try {
    const existing = await prisma.companyData.findUnique({ where: { studioId: studio.id } });
    if (existing) {
      await prisma.companyData.update({
        where: { studioId: studio.id },
        data: { rawDataNewton: allData, fetchedAt: new Date() },
      });
    } else {
      const co = cards?.data?.[0];
      await prisma.companyData.create({
        data: {
          studioId: studio.id,
          ogrn: co?.ogrn || null,
          fullName: co?.fullName || co?.name || null,
          address: co?.legalAddress || null,
          director: co?.director || null,
          registrationDate: co?.establishmentDate || null,
          status: co?.active !== false ? "Действует" : "Не действует",
          employees: co?.employeesCount || null,
          rawDataNewton: allData,
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
