/**
 * Обогащение ПОДРЯДЧИКОВ (Company) через DataNewton.
 * 5 ключей с ротацией. При исчерпании всех — стоп.
 * При повторном запуске — продолжает с необработанных.
 * 
 * Запуск: node scripts/enrich-companies.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

const DN_KEYS = [
  process.env.DATANEWTON_API_KEY,
  process.env.DATANEWTON_API_KEY_2,
  process.env.DATANEWTON_API_KEY_3,
  process.env.DATANEWTON_API_KEY_4,
  process.env.DATANEWTON_API_KEY_5,
].filter(Boolean);
let dnKeyIndex = 0;
const DN_BASE = "https://api.datanewton.ru";

if (!DN_KEYS.length) { console.error("❌ DATANEWTON_API_KEY не задан"); process.exit(1); }
console.log(`🔑 DataNewton ключей: ${DN_KEYS.length}`);

let allKeysExhausted = false;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ==================== DATANEWTON ====================

async function dnPost(path, body, queryParams = "") {
  if (allKeysExhausted) return null;

  const url = `${DN_BASE}${path}?key=${DN_KEYS[dnKeyIndex]}${queryParams}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.status === 429 || data.code === 429 || (data.message && data.message.includes("лимит"))) {
      if (dnKeyIndex < DN_KEYS.length - 1) {
        dnKeyIndex++;
        console.log(`  🔄 DataNewton ключ ${dnKeyIndex + 1}/${DN_KEYS.length}`);
        return dnPost(path, body, queryParams);
      }
      console.log(`\n🛑 ВСЕ ${DN_KEYS.length} КЛЮЧЕЙ ИСЧЕРПАНЫ. Останавливаемся.`);
      allKeysExhausted = true;
      return null;
    }
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

  const suggest = await dnPost("/v1/suggestions", { search_query: inn, type: "all" });
  if (allKeysExhausted) return null;

  if (!suggest?.data?.length) {
    console.log(`  ⚠ DataNewton ответ:`, JSON.stringify(suggest).slice(0, 300));
  }
  const company = suggest?.data?.[0];
  const ogrn = company?.ogrn;
  console.log(`  ${company ? "✓" : "—"} suggestions (ОГРН: ${ogrn || "—"})`);
  await sleep(500);

  if (!ogrn) {
    console.log(`  ✗ ОГРН не найден в DataNewton`);
    return { raw: { company: null }, notFound: true };
  }

  const allData = { company };

  const vac = await dnPost("/v1/vacancies", { ogrn, limit: 20, offset: 0 });
  if (allKeysExhausted) return null;
  allData.vacancies = vac;
  await sleep(500);

  const prod = await dnPost("/v1/products", { ogrn, limit: 20, offset: 0 });
  if (allKeysExhausted) return null;
  allData.products = prod;
  await sleep(500);

  const arb = await dnPost("/v1/arbitration/batch-cases", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0");
  if (allKeysExhausted) return null;
  allData.arbitration = arb;
  await sleep(500);

  const contr = await dnPost("/v1/batchContracts", { ogrn: [ogrn], limit: 50, offset: 0 }, "&limit=50&offset=0");
  if (allKeysExhausted) return null;
  allData.contracts = contr;
  await sleep(500);

  const leases = await dnPost("/v1/leases", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
  if (allKeysExhausted) return null;
  allData.leases = leases;
  await sleep(500);

  const changes = await dnPost("/v1/batchChanges", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
  if (allKeysExhausted) return null;
  allData.changes = changes;
  await sleep(500);

  const tax = await dnPost("/v1/taxpayerStatuses", { inn_list: [inn] });
  if (allKeysExhausted) return null;
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

  const dn = await enrichDataNewton(comp.inn);

  if (allKeysExhausted) return false;

  try {
    await prisma.company.update({
      where: { id: comp.id },
      data: {
        ogrn: dn?.ogrn || comp.ogrn || null,
        address: dn?.address || comp.address || null,
        employees: dn?.employees ?? comp.employees ?? null,
        foundedYear: dn?.foundedYear ?? comp.foundedYear ?? null,
        status: dn?.status || comp.status || null,
        courtCasesCount: dn?.courtCasesCount || 0,
        courtCases: dn?.courtCases || null,
        contractsCount: dn?.contractsCount || 0,
        contracts: dn?.contracts || null,
        rawDataNewton: dn?.raw || null,
        enrichedAt: new Date(),
      },
    });
    console.log(`  ✅ Сохранено`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
  return true;
}

async function main() {
  // Берём только необработанных (enrichedAt = null)
  const companies = await prisma.company.findMany({
    where: {
      inn: { not: null },
      enrichedAt: null,
    },
    orderBy: { name: "asc" },
  });

  const totalAll = await prisma.company.count({ where: { inn: { not: null } } });
  const alreadyDone = totalAll - companies.length;

  console.log(`\n🔍 DataNewton: обогащение подрядчиков`);
  console.log(`   Всего с ИНН: ${totalAll}`);
  console.log(`   Уже обработано: ${alreadyDone}`);
  console.log(`   Осталось: ${companies.length}\n`);

  if (companies.length === 0) {
    console.log("✅ Все подрядчики уже обработаны!");
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  for (const comp of companies) {
    const ok = await processCompany(comp);
    if (!ok) break; // Ключи кончились — стоп
    done++;
    if (done % 10 === 0) console.log(`\n--- Обработано ${done}/${companies.length} (всего ${alreadyDone + done}/${totalAll}) ---\n`);
  }

  console.log(`\n${"━".repeat(40)}`);
  if (allKeysExhausted) {
    console.log(`⏸ Остановлено: все ключи исчерпаны`);
    console.log(`   Обработано за этот запуск: ${done}`);
    console.log(`   Осталось: ${companies.length - done}`);
    console.log(`   Запусти скрипт снова когда лимиты обновятся`);
  } else {
    console.log(`✅ Готово! Обработано: ${done}`);
  }
  console.log(`${"━".repeat(40)}\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
