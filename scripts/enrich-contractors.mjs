/**
 * Обогащение всех подрядчиков (Company) через Checkko + DataNewton по ИНН.
 */
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const CHECKKO_KEYS = [process.env.CHECKKO_API_KEY, process.env.CHECKKO_API_KEY_2].filter(Boolean);
let ckIdx = 0;
const DN_KEY = process.env.DATANEWTON_API_KEY;

async function checkkoApi(endpoint, inn) {
  if (CHECKKO_KEYS.length === 0) return null;
  try {
    const res = await fetch(`https://api.checko.ru/v2${endpoint}?key=${CHECKKO_KEYS[ckIdx]}&inn=${inn}`);
    const d = await res.json();
    if (d.meta?.status === 429 || d.meta?.message?.includes("лимит")) {
      if (ckIdx < CHECKKO_KEYS.length - 1) { ckIdx++; console.log(`  🔄 Checkko ключ ${ckIdx + 1}`); return checkkoApi(endpoint, inn); }
      console.log("  ⚠ Checkko: лимит"); return null;
    }
    return d.data || null;
  } catch { return null; }
}

async function dnPost(path, body, qp = "") {
  try {
    const res = await fetch(`https://api.datanewton.ru${path}?key=${DN_KEY}${qp}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json(); return (d.code && d.code >= 400) ? null : d;
  } catch { return null; }
}

async function enrichCompany(company) {
  const inn = company.inn;
  console.log(`→ ${company.name} (ИНН: ${inn})`);

  // Checkko
  const ckCompany = await checkkoApi("/company", inn); await new Promise(r => setTimeout(r, 500));
  const ckFinances = await checkkoApi("/finances", inn); await new Promise(r => setTimeout(r, 500));
  const ckLegalCases = await checkkoApi("/legal-cases", inn); await new Promise(r => setTimeout(r, 500));
  const ckContracts = await checkkoApi("/contracts", inn); await new Promise(r => setTimeout(r, 500));
  const ckEnforcements = await checkkoApi("/enforcements", inn); await new Promise(r => setTimeout(r, 500));

  // DataNewton
  const suggest = await dnPost("/v1/suggestions", { search_query: inn, limit: 1 }); await new Promise(r => setTimeout(r, 300));
  const dnCompany = suggest?.data?.[0];
  const ogrn = dnCompany?.ogrn;
  let dnArbitration = null;
  if (ogrn) {
    dnArbitration = await dnPost("/v1/arbitration/batch-cases", { ogrn: [ogrn], limit: 20, offset: 0 }, "&limit=20&offset=0");
    await new Promise(r => setTimeout(r, 300));
  }

  // Parse
  const years = ckFinances?.Документы || (Array.isArray(ckFinances) ? ckFinances : []);
  const latest = years[0] || null;
  const revenue = latest?.Выручка ?? latest?.["2110"] ?? null;
  const profit = latest?.ЧистаяПрибыль ?? latest?.["2400"] ?? null;
  const casesCount = ckLegalCases?.Всего ?? 0;
  const enfCount = ckEnforcements?.Всего ?? 0;
  const contractsCount = ckContracts?.Всего ?? 0;
  const fullName = ckCompany?.НаимПолн || dnCompany?.full_name || null;
  const director = ckCompany?.Руководитель?.ФИО || null;
  const address = ckCompany?.ЮрАдрес?.АдресРФ || dnCompany?.address || null;
  const status = ckCompany?.Статус?.Наим || (dnCompany?.active ? "Действует" : null);
  const regDate = ckCompany?.ДатаРег || dnCompany?.establishment_date || null;
  const employees = ckCompany?.СЧР ?? null;

  // Update company
  const updateData = {};
  if (!company.name || company.name.startsWith("Компания ")) updateData.name = fullName || dnCompany?.name || company.name;
  if (!company.ogrn && ogrn) updateData.ogrn = ogrn;
  if (!company.address && address) updateData.address = address;
  if (!company.city && dnCompany?.region) updateData.city = dnCompany.region;
  if (revenue) updateData.revenue = String(revenue);
  if (employees) updateData.employees = employees;
  if (regDate) updateData.foundedYear = parseInt(regDate) || null;

  try {
    if (Object.keys(updateData).length > 0) {
      await prisma.company.update({ where: { id: company.id }, data: updateData });
    }
    console.log(`  ✓ ${fullName || company.name} | выручка: ${revenue || "—"} | суды: ${casesCount} | исп.пр.: ${enfCount} | контракты: ${contractsCount}`);
  } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  const companies = await prisma.company.findMany({
    where: { inn: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n📊 Обогащение ${companies.length} подрядчиков по ИНН...\n`);

  for (const company of companies) {
    await enrichCompany(company);
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
