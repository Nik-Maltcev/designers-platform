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

async function dnGet(path, params = "") {
  if (allKeysExhausted) return null;
  const url = `${DN_BASE}${path}?key=${DN_KEYS[dnKeyIndex]}${params}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (res.status === 429 || data.code === 429) {
      if (dnKeyIndex < DN_KEYS.length - 1) {
        dnKeyIndex++;
        console.log(`  🔄 DataNewton ключ ${dnKeyIndex + 1}/${DN_KEYS.length}`);
        return dnGet(path, params);
      }
      console.log(`\n🛑 ВСЕ ${DN_KEYS.length} КЛЮЧЕЙ ИСЧЕРПАНЫ.`);
      allKeysExhausted = true;
      return null;
    }
    // "нет доступа" — пропускаем эндпоинт, не ротируем ключ
    if (data.code && data.code >= 400) {
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
  const allData = {};

  // 1. Общая информация (GET)
  const cp = await dnGet("/v1/counterparty", `&inn=${inn}`);
  if (allKeysExhausted) return null;
  allData.counterparty = cp;
  const cpData = cp?.data || cp || {};
  const ogrn = cpData.ogrn;
  console.log(`  ${ogrn ? "✓" : "—"} counterparty (ОГРН: ${ogrn || "—"})`);
  await sleep(400);

  // 2. Финансы (GET)
  const fin = await dnGet("/v1/finance", `&inn=${inn}`);
  if (allKeysExhausted) return null;
  allData.finance = fin;
  console.log(`  ${fin?.data ? "✓" : "—"} finance`);
  await sleep(400);

  // 3. Арбитражные дела (GET)
  const arb = await dnGet("/v1/arbitration-cases", `&inn=${inn}&limit=50&offset=0`);
  if (allKeysExhausted) return null;
  allData.arbitration = arb;
  const arbData = arb?.data || [];
  console.log(`  ${arbData.length > 0 ? "✓" : "—"} arbitration (${arbData.length})`);
  await sleep(400);

  // 4. Госконтракты (GET)
  const gov = await dnGet("/v1/governmentContracts", `&inn=${inn}&limit=50&offset=0`);
  if (allKeysExhausted) return null;
  allData.governmentContracts = gov;
  const govData = gov?.data || [];
  console.log(`  ${govData.length > 0 ? "✓" : "—"} govContracts (${govData.length})`);
  await sleep(400);

  // 5. Лизинг (GET)
  const leases = await dnGet("/v1/lease-contracts", `&inn=${inn}`);
  if (allKeysExhausted) return null;
  allData.leases = leases;
  console.log(`  ${leases?.data ? "✓" : "—"} leases`);
  await sleep(400);

  // 6. Банкротство (GET)
  const bankr = await dnGet("/v1/bankruptcy", `&inn=${inn}`);
  if (allKeysExhausted) return null;
  allData.bankruptcy = bankr;
  console.log(`  ${bankr?.data ? "✓" : "—"} bankruptcy`);
  await sleep(400);

  // 7. Проверки (GET)
  const insp = await dnGet("/v1/inspections", `&inn=${inn}`);
  if (allKeysExhausted) return null;
  allData.inspections = insp;
  console.log(`  ${insp?.data ? "✓" : "—"} inspections`);
  await sleep(400);

  // 8. Госконтракты статистика (GET)
  const govStat = await dnGet("/v1/governmentContractsStat", `&inn=${inn}`);
  if (allKeysExhausted) return null;
  allData.governmentContractsStat = govStat;
  console.log(`  ${govStat?.data ? "✓" : "—"} govContractsStat`);
  await sleep(400);

  // Парсим финансы
  const finData = fin?.data || {};
  const finReports = Array.isArray(finData) ? finData : finData?.reports || [];
  const latestFin = Array.isArray(finReports) && finReports.length > 0 ? finReports[0] : null;
  const revenue = latestFin?.revenue ?? latestFin?.["2110"] ?? null;
  const profit = latestFin?.net_profit ?? latestFin?.["2400"] ?? null;

  console.log(`  📊 Выручка: ${revenue || "—"} | Арбитраж: ${arbData.length} | Госконтракты: ${govData.length}`);

  return {
    ogrn: ogrn || null,
    fullName: cpData.full_name || cpData.fullName || null,
    address: cpData.legal_address || cpData.address || null,
    director: cpData.director || cpData.head?.name || null,
    registrationDate: cpData.registration_date || null,
    employees: cpData.employees_count ?? null,
    foundedYear: cpData.registration_date ? parseInt(String(cpData.registration_date).slice(0, 4)) : null,
    status: cpData.active === true ? "Действует" : cpData.active === false ? "Не действует" : null,
    revenue: revenue != null ? String(revenue) : null,
    profit: profit != null ? String(profit) : null,
    courtCasesCount: arbData.length,
    courtCases: arbData.length > 0 ? arbData.slice(0, 20) : null,
    contractsCount: govData.length,
    contracts: govData.length > 0 ? govData.slice(0, 20) : null,
    raw: allData,
  };
}

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
        director: dn?.director || comp.director || null,
        registrationDate: dn?.registrationDate || comp.registrationDate || null,
        employees: dn?.employees ?? comp.employees ?? null,
        foundedYear: dn?.foundedYear ?? comp.foundedYear ?? null,
        status: dn?.status || comp.status || null,
        revenue: dn?.revenue || comp.revenue || null,
        profit: dn?.profit || comp.profit || null,
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
  const companies = await prisma.company.findMany({
    where: { inn: { not: null }, enrichedAt: null },
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
    if (!ok) break;
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
