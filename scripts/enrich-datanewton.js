import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const KEY = process.env.DATANEWTON_API_KEY;
const BASE = "https://api.datanewton.ru/v1";

const ENDPOINTS = [
  "/company", "/finances", "/legal-cases", "/enforcements",
  "/contracts", "/inspections", "/vacancies", "/licenses",
  "/bankruptcy-messages", "/bank", "/fedresurs",
  "/pledges", "/leasing", "/trademarks",
];

async function dnGet(endpoint, inn) {
  const url = `${BASE}${endpoint}?key=${KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inn, limit: 50 }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(`  ✗ ${endpoint}: ${err.message}`);
    return null;
  }
}

async function enrichStudio(studio) {
  console.log(`→ ${studio.name} (ИНН: ${studio.inn})`);
  const allData = {};

  for (const ep of ENDPOINTS) {
    const data = await dnGet(ep, studio.inn);
    const name = ep.replace("/", "");
    allData[name] = data;
    console.log(`  ${data?.data ? "✓" : "—"} ${ep}`);
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Save raw DataNewton data alongside Checkko data
  try {
    const existing = await prisma.companyData.findUnique({ where: { studioId: studio.id } });

    if (existing) {
      await prisma.companyData.update({
        where: { studioId: studio.id },
        data: {
          rawDataNewton: allData,
          fetchedAt: new Date(),
        },
      });
    } else {
      // Extract key fields from company endpoint
      const co = allData.company?.data;
      await prisma.companyData.create({
        data: {
          studioId: studio.id,
          ogrn: co?.ogrn || null,
          fullName: co?.fullName || co?.name || null,
          address: co?.legalAddress || null,
          director: co?.director?.name || null,
          registrationDate: co?.establishmentDate || null,
          status: co?.active ? "Действует" : "Не действует",
          employees: co?.employeesCount || null,
          rawDataNewton: allData,
        },
      });
    }
    console.log(`  ✅ saved DataNewton data`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const studios = await prisma.studio.findMany({
    where: { inn: { not: null } },
  });
  console.log(`\nОбогащение ${studios.length} студий через DataNewton API...\n`);

  for (const studio of studios) {
    await enrichStudio(studio);
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
