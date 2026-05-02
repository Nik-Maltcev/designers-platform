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
    if (res.status === 429 || data.code === 429 || (data.message && (data.message.includes("лимит") || data.message.includes("доступ")))) {
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

async function dnGet(path, queryParams = "") {
  if (allKeysExhausted) return null;
  const url = `${DN_BASE}${path}?key=${DN_KEYS[dnKeyIndex]}${queryParams}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (res.status === 429 || data.code === 429 || (data.message && (data.message.includes("лимит") || data.message.includes("доступ")))) {
      if (dnKeyIndex < DN_KEYS.length - 1) {
        dnKeyIndex++;
        console.log(`  🔄 DataNewton ключ ${dnKeyIndex + 1}/${DN_KEYS.length}`);
        return dnGet(path, queryParams);
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
  const allData = {};

  // 1. Общая информация о контрагенте
  const cp = await dnPost("/v1/counterparty", { inn });
  if (allKeysExhausted) return null;
  allData.counterparty = cp;
  const ogrn = cp?.data?.ogrn || cp?.ogrn;
  console.log(`  ${cp?.data ? "✓" : "—"} counterparty (ОГРН: ${ogrn || "—"})`);
  await sleep(400);

  // 2. Финансы
  const fin = await dnPost("/v1/finance", { inn });
  if (allKeysExhausted) return null;
  allData.finance = fin;
  console.log(`  ${fin?.data ? "✓" : "—"} finance`);
  await sleep(400);

  // 3. Риски
  const risks = await dnPost("/v1/risks", { inn });
  if (allKeysExhausted) return null;
  allData.risks = risks;
  console.log(`  ${risks?.data ? "✓" : "—"} risks`);
  await sleep(400);

  // 4. Скоринг
  const scoring = await dnPost("/v1/scoring", { inn });
  if (allKeysExhausted) return null;
  allData.scoring = scoring;
  console.log(`  ${scoring?.data ? "✓" : "—"} scoring`);
  await sleep(400);

  // 5. Арбитражные дела
  const arb = await dnPost("/v1/arbitration-cases", { inn, limit: 50, offset: 0 });
  if (allKeysExhausted) return null;
  allData.arbitration = arb;
  console.log(`  ${arb?.data ? "✓" : "—"} arbitration (${arb?.data?.length || 0} дел)`);
  await sleep(400);

  // 6. Госконтракты
  const gov = await dnPost("/v1/governmentContracts", { inn, limit: 50, offset: 0 });
  if (allKeysExhausted) return null;
  allData.governmentContracts = gov;
  console.log(`  ${gov?.data ? "✓" : "—"} govContracts`);
  await sleep(400);

  // 7. Исполнительные производства (ФССП)
  const fssp = await dnPost("/v1/fssp", { inn });
  if (allKeysExhausted) return null;
  allData.fssp = fssp;
  console.log(`  ${fssp?.data ? "✓" : "—"} fssp`);
  await sleep(400);

  // 8. Банкротство
  const bankr = await dnPost("/v1/bankruptcy", { inn });
  if (allKeysExhausted) return null;
  allData.bankruptcy = bankr;
  console.log(`  ${bankr?.data ? "✓" : "—"} bankruptcy`);
  await sleep(400);

  // 9. Проверки
  const insp = await dnPost("/v1/inspections", { inn });
  if (allKeysExhausted) return null;
  allData.inspections = insp;
  console.log(`  ${insp?.data ? "✓" : "—"} inspections`);
  await sleep(400);

  // 10. Налоги
  const taxes = await dnPost("/v1/taxInfo", { inn });
  if (allKeysExhausted) return null;
  allData.taxes = taxes;
  console.log(`  ${taxes?.data ? "✓" : "—"} taxes`);
  await sleep(400);

  // 11. Вакансии
  const vac = await dnPost("/v1/vacancies", { inn, limit: 20, offset: 0 });
  if (allKeysExhausted) return null;
  allData.vacancies = vac;
  console.log(`  ${vac?.data ? "✓" : "—"} vacancies (${vac?.total_vacancies || 0})`);
  await sleep(400);

  // 12. Лизинг
  const leases = await dnPost("/v1/lease-contracts", { inn });
  if (allKeysExhausted) return null;
  allData.leases = leases;
  console.log(`  ${leases?.data ? "✓" : "—"} leases`);
  await sleep(400);

  // 13. Сертификаты/декларации
  const prod = await dnPost("/v1/products", { inn, limit: 20, offset: 0 });
  if (allKeysExhausted) return null;
  allData.products = prod;
  console.log(`  ${prod?.data ? "✓" : "—"} products`);
  await sleep(400);

  // 14. Блокировки счетов
  const blocked = await dnPost("/v1/blockedBankAccounts", { inn });
  if (allKeysExhausted) return null;
  allData.blocked = blocked;
  console.log(`  ${blocked?.data ? "✓" : "—"} blockedAccounts`);
  await sleep(400);

  // 15. СРО
  const sro = await dnPost("/v1/sroMembership", { inn });
  if (allKeysExhausted) return null;
  allData.sro = sro;
  console.log(`  ${sro?.data ? "✓" : "—"} sro`);
  await sleep(400);

  // Парсим данные
  const cpData = cp?.data || cp || {};
  const finData = fin?.data || {};
  const arbData = arb?.data || [];
  const govData = gov?.data || [];
  const fsspData = fssp?.data || [];

  // Выручка из финансов
  const finReports = Array.isArray(finData) ? finData : finData?.reports || [];
  const latestFin = finReports[0];
  const revenue = latestFin?.revenue ?? latestFin?.["2110"] ?? null;
  const profit = latestFin?.net_profit ?? latestFin?.["2400"] ?? null;

  console.log(`  📊 Выручка: ${revenue || "—"} | Арбитраж: ${arbData.length} | Госконтракты: ${govData.length} | ФССП: ${fsspData.length}`);

  return {
    ogrn: ogrn || null,
    fullName: cpData.full_name || cpData.fullName || null,
    address: cpData.legal_address || cpData.address || null,
    director: cpData.director || cpData.head?.name || null,
    registrationDate: cpData.registration_date || cpData.establishmentDate || null,
    employees: cpData.employees_count ?? cpData.employees ?? null,
    foundedYear: cpData.registration_date ? parseInt(String(cpData.registration_date).slice(0, 4)) : null,
    status: cpData.active === true ? "Действует" : cpData.active === false ? "Не действует" : cpData.status || null,
    revenue: revenue != null ? String(revenue) : null,
    profit: profit != null ? String(profit) : null,
    courtCasesCount: arbData.length || 0,
    courtCases: arbData.length > 0 ? arbData.slice(0, 20) : null,
    contractsCount: govData.length || 0,
    contracts: govData.length > 0 ? govData.slice(0, 20) : null,
    enforcementsCount: fsspData.length || 0,
    enforcements: fsspData.length > 0 ? fsspData.slice(0, 20) : null,
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
        enforcementsCount: dn?.enforcementsCount || 0,
        enforcements: dn?.enforcements || null,
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
