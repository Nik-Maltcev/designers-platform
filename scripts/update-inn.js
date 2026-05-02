import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function fetchInnFromPages(baseUrl) {
  const subpages = ["/contacts", "/about", "/kontakty", "/rekvizity", "/policy", "/oferta", "/requisites", "/contact", "/privacy", "/legal"];
  for (const path of subpages) {
    try {
      const url = baseUrl.replace(/\/+$/, "") + path;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ProjektListBot/1.0)" },
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const html = await res.text();
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const innMatch = text.match(/ИНН[:\s]*(\d{10,12})/i) || text.match(/инн[:\s]*(\d{10,12})/i);
      if (innMatch) return innMatch[1];
    } catch { /* skip */ }
  }
  return null;
}

async function main() {
  const companies = await prisma.company.findMany({ where: { inn: null } });
  console.log(`Обновление ИНН для ${companies.length} подрядчиков без ИНН...\n`);

  let found = 0;
  for (const company of companies) {
    if (!company.website) continue;
    console.log(`→ ${company.name} (${company.website})`);
    const inn = await fetchInnFromPages(company.website);
    if (inn) {
      await prisma.company.update({ where: { id: company.id }, data: { inn } });
      console.log(`  ✓ ИНН: ${inn}`);
      found++;
    } else {
      console.log(`  ✗ ИНН не найден`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n✅ Готово! Найдено ИНН: ${found}/${companies.length}`);
  await prisma.$disconnect();
}

main().catch(console.error);
