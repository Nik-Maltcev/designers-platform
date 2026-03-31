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
  const studios = await prisma.studio.findMany({ where: { inn: null } });
  console.log(`Обновление ИНН для ${studios.length} студий без ИНН...\n`);

  for (const studio of studios) {
    if (!studio.website) continue;
    console.log(`→ ${studio.name} (${studio.website})`);
    const inn = await fetchInnFromPages(studio.website);
    if (inn) {
      await prisma.studio.update({ where: { id: studio.id }, data: { inn } });
      console.log(`  ✓ ИНН: ${inn}`);
    } else {
      console.log(`  ✗ ИНН не найден`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
