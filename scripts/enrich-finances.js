/**
 * Обогащение ПОДРЯДЧИКОВ (Company) — ТОЛЬКО финансы через Checkko.
 * 18 ключей с ротацией. При исчерпании всех — стоп.
 * При повторном запуске — продолжает с необработанных (без revenue).
 * 
 * Запуск: node scripts/enrich-finances.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

const KEYS = [];
for (let i = 1; i <= 30; i++) {
  const key = process.env[i === 1 ? "CHECKKO_API_KEY" : `CHECKKO_API_KEY_${i}`];
  if (key) KEYS.push(key);
}

let keyIndex = 0;
const BASE = "https://api.checko.ru/v2";

if (!KEYS.length) { console.error("❌ CHECKKO_API_KEY не задан"); process.exit(1); }
console.log(`🔑 Checkko ключей: ${KEYS.length}`);

let allKeysExhausted = false;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function checkkoApi(endpoint, inn) {
  if (allKeysExhausted) return null;
  const url = `${BASE}${endpoint}?key=${KEYS[keyIndex]}&inn=${inn}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.meta?.status === 429 || data.meta?.message?.includes("лимит")) {
      if (keyIndex < KEYS.length - 1) {
        keyIndex++;
        console.log(`  🔄 Checkko ключ ${keyIndex + 1}/${KEYS.length}`);
        return checkkoApi(endpoint, inn);
      }
      console.log(`\n🛑 ВСЕ ${KEYS.length} КЛЮЧЕЙ ИСЧЕРПАНЫ.`);
      allKeysExhausted = true;
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

async function processCompany(comp) {
  console.log(`→ ${comp.name} (ИНН: ${comp.inn})`);

  const finances = await checkkoApi("/finances", comp.inn);
  if (allKeysExhausted) return false;
  
  console.log(`  📦 Raw:`, JSON.stringify(finances).slice(0, 300));
  await sleep(1200);

  const years = finances?.Документы || finances || [];
  const latest = Array.isArray(years) ? years[0] : null;
  const revenue = latest?.Выручка ?? latest?.["2110"] ?? null;
  const profit = latest?.ЧистаяПрибыль ?? latest?.["2400"] ?? null;

  if (!revenue && !profit) {
    console.log(`  — Финансов нет`);
    // Помечаем что проверили, чтобы не проверять повторно
    await prisma.company.update({
      where: { id: comp.id },
      data: { revenue: "0" },
    });
    return true;
  }

  try {
    // Сохраняем финансы в rawCheckko
    const existingRaw = comp.rawCheckko || {};
    await prisma.company.update({
      where: { id: comp.id },
      data: {
        revenue: revenue != null ? String(revenue) : null,
        profit: profit != null ? String(profit) : null,
        rawCheckko: { ...existingRaw, finances },
      },
    });
    console.log(`  ✓ Выручка: ${revenue || "—"} | Прибыль: ${profit || "—"}`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
  return true;
}

async function main() {
  const companies = await prisma.company.findMany({
    where: {
      inn: { not: null },
      revenue: null,
    },
    orderBy: { name: "asc" },
  });

  const totalAll = await prisma.company.count({ where: { inn: { not: null } } });
  const alreadyDone = totalAll - companies.length;

  console.log(`\n💰 Checkko: финансы подрядчиков`);
  console.log(`   Всего с ИНН: ${totalAll}`);
  console.log(`   Уже с финансами: ${alreadyDone}`);
  console.log(`   Осталось: ${companies.length}\n`);

  if (companies.length === 0) {
    console.log("✅ У всех подрядчиков уже есть финансы!");
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  for (const comp of companies) {
    const ok = await processCompany(comp);
    if (!ok) break;
    done++;
    if (done % 20 === 0) console.log(`\n--- Обработано ${done}/${companies.length} (ключ ${keyIndex + 1}/${KEYS.length}) ---\n`);
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
