import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function fetchImages(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProjektListBot/1.0)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();
    const baseUrlObj = new URL(url);
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    const bgMatches = html.match(/url\(["']?([^"')]+)["']?\)/gi) || [];
    const allSrcs = [
      ...imgMatches.map((m) => m.match(/src=["']([^"']+)["']/)?.[1]),
      ...bgMatches.map((m) => m.match(/url\(["']?([^"')]+)["']?\)/)?.[1]),
    ].filter(Boolean);
    return allSrcs
      .map((src) => {
        if (src.startsWith("//")) return "https:" + src;
        if (src.startsWith("/")) return baseUrlObj.origin + src;
        if (src.startsWith("http")) return src;
        if (src.startsWith("data:")) return null;
        return baseUrlObj.origin + "/" + src;
      })
      .filter(Boolean)
      .filter((src) => !src.includes("logo") && !src.includes("icon") && !src.includes("favicon") && !src.includes(".svg"))
      .filter((src, i, arr) => arr.indexOf(src) === i)
      .slice(0, 15);
  } catch { return []; }
}

async function main() {
  const studios = await prisma.studio.findMany({ include: { projects: true } });
  console.log(`Обновление картинок для ${studios.length} студий...\n`);

  for (const studio of studios) {
    if (!studio.website) continue;
    console.log(`→ ${studio.name}`);
    const images = await fetchImages(studio.website);
    if (images.length === 0) { console.log("  ✗ нет картинок"); continue; }

    // Update studio main image
    if (!studio.imageUrl || !studio.imageUrl.startsWith("http")) {
      await prisma.studio.update({ where: { id: studio.id }, data: { imageUrl: images[0] } });
      console.log(`  ✓ обложка: ${images[0].slice(0, 60)}...`);
    }

    // Update project images
    for (let i = 0; i < studio.projects.length; i++) {
      const project = studio.projects[i];
      if (project.imageUrls.length === 0 || !project.imageUrls[0]?.startsWith("http")) {
        const projectImg = images[i + 1] || images[0];
        if (projectImg) {
          await prisma.project.update({ where: { id: project.id }, data: { imageUrls: [projectImg] } });
        }
      }
    }
    console.log(`  ✓ ${images.length} картинок найдено`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
