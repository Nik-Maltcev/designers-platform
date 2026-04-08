import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function isImageAlive(imgUrl) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(imgUrl, {
      method: "HEAD",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProjektListBot/1.0)" },
    });
    clearTimeout(t);
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "";
    return ct.startsWith("image/");
  } catch { return false; }
}

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
    const dataSrcMatches = html.match(/<img[^>]+data-(?:src|original)=["']([^"']+)["']/gi) || [];
    const bgMatches = html.match(/url\(["']?([^"')]+)["']?\)/gi) || [];
    const allSrcs = [
      ...dataSrcMatches.map((m) => m.match(/data-(?:src|original)=["']([^"']+)["']/)?.[1]),
      ...imgMatches.map((m) => m.match(/src=["']([^"']+)["']/)?.[1]),
      ...bgMatches.map((m) => m.match(/url\(["']?([^"')]+)["']?\)/)?.[1]),
    ].filter(Boolean);
    const junk = [
      "logo", "icon", "favicon", ".svg", "tildacopy", "skip_track", "arrow",
      "pbg", "spinner", "loader", "placeholder", "pixel", "spacer", "blank",
      "tracking", "analytics", "badge", "button", "btn", "widget",
    ];
    return allSrcs
      .map((src) => {
        if (src.startsWith("//")) return "https:" + src;
        if (src.startsWith("/")) return baseUrlObj.origin + src;
        if (src.startsWith("http")) return src;
        if (src.startsWith("data:")) return null;
        return baseUrlObj.origin + "/" + src;
      })
      .filter(Boolean)
      // For Tilda: strip tiny resize directives to get full-size image
      .map((src) => src.replace(/-\/resizeb?\/\d+x\d*(?:\/)/, ""))
      .filter((src) => {
        const lower = src.toLowerCase();
        if (junk.some((j) => lower.includes(j))) return false;
        // Only keep actual image formats
        if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(src) && !src.includes("/format/webp")) return false;
        return true;
      })
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

    // Verify each image URL is actually reachable
    const verified = [];
    for (const img of images) {
      if (await isImageAlive(img)) {
        verified.push(img);
      } else {
        console.log(`  ✗ битая: ${img.slice(0, 70)}...`);
      }
    }
    if (verified.length === 0) { console.log("  ✗ ни одна картинка не прошла проверку"); continue; }

    // Update studio main image
    await prisma.studio.update({ where: { id: studio.id }, data: { imageUrl: verified[0] } });
    console.log(`  ✓ обложка: ${verified[0].slice(0, 60)}...`);

    // Update project images
    for (let i = 0; i < studio.projects.length; i++) {
      const project = studio.projects[i];
      const projectImg = verified[Math.min(i + 1, verified.length - 1)] || verified[0];
      if (projectImg) {
        await prisma.project.update({ where: { id: project.id }, data: { imageUrls: [projectImg] } });
      }
    }
    console.log(`  ✓ ${verified.length}/${images.length} картинок прошли проверку`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
