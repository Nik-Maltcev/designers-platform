/**
 * Обогащение ПОДРЯДЧИКОВ (Company) через DataNewton API по ИНН.
 * 
 * Запуск: node scripts/enrich-datanewton-companies.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KEY = process.env.DATANEWTON_API_KEY;
const BASE = "https://api.datanewton.ru";

if (!KEY) { console.error("❌ DATANEWTON_API_KEY не задан"); process.exit(1); }

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

async function enrichCompany(comp) {
  console.log(`→ ${comp.name} (ИНН: ${comp.inn})`);
  const allData = {};

  // 1. Find company by INN
  const suggest = await dnPost("/v1/suggestions", { search_query: comp.inn, limit: 1 });
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
  const tax = await dnPost("/v1/taxpayerStatuses", { inn_list: [comp.inn] });
  allData.taxpayer = tax;
  console.log(`  ${tax?.data ? "✓" : "—"} taxpayer`);
  await new Promise((r) => setTimeout(r, 500));

  // Update Company
  try {
    const updateData = {
      ogrn: ogrn || comp.ogrn || null,
      address: company?.legal_address || comp.address || null,
      employees: company?.employees_count ?? comp.employees ?? null,
      foundedYear: company?.registration_date ? parseInt(company.registration_date.slice(0, 4)) : comp.foundedYear ?? null,
    };

    await prisma.company.update({
      where: { id: comp.id },
      data: updateData,
    });

    console.log(`  ✅ saved`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const companies = await prisma.company.findMany({ where: { inn: { not: null } } });
  console.log(`\nDataNewton: обогащение ${companies.length} подрядчиков...\n`);

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
