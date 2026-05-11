/**
 * Фильтрация картинок проектов через DeepSeek Vision.
 * Удаляет из imageUrls всё что не является фото интерьера/экстерьера.
 * 
 * Запуск: node scripts/filter-images.mjs
 *         node scripts/filter-images.mjs --limit=50
 *         node scripts/filter-images.mjs --studio="Arch Detali"
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) { console.error("❌ OPENAI_API_KEY не задан"); process.exit(1); }

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : null;
const studioArg = args.find(a => a.startsWith("--studio="));
const STUDIO_NAME = studioArg ? studioArg.split("=").slice(1).join("=") : null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function isInteriorImage(imageUrl) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "low" },
              },
              {
                type: "text",
                text: "Is this a photo of an interior, exterior, furniture, architecture, or design project? Answer ONLY YES or NO. If it's a portrait, logo, icon, screenshot, text, banner, or avatar — answer NO.",
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.log(`    ⚠ GPT ${res.status}: ${err.slice(0, 100)}`);
      return true; // При ошибке оставляем
    }

    const data = await res.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
    return answer.includes("YES");
  } catch (err) {
    console.log(`    ✗ ${err.message}`);
    return true; // При ошибке оставляем
  }
}

async function processProject(project) {
  if (!project.imageUrls || project.imageUrls.length === 0) return;

  const kept = [];
  const removed = [];

  for (const url of project.imageUrls) {
    const ok = await isInteriorImage(url);
    if (ok) {
      kept.push(url);
    } else {
      removed.push(url);
    }
    await sleep(500);
  }

  if (removed.length > 0) {
    await prisma.project.update({
      where: { id: project.id },
      data: { imageUrls: kept },
    });
    console.log(`    ✓ Оставлено: ${kept.length}, удалено: ${removed.length}`);
    removed.forEach(u => console.log(`      ✗ ${u.slice(0, 80)}`));
  } else {
    console.log(`    ✓ Все ${kept.length} ок`);
  }
}

async function main() {
  let where = {};
  if (STUDIO_NAME) {
    const studio = await prisma.studio.findFirst({
      where: { name: { contains: STUDIO_NAME, mode: "insensitive" } },
    });
    if (studio) {
      where.studioId = studio.id;
      console.log(`🎯 Студия: ${studio.name}\n`);
    }
  }

  let projects = await prisma.project.findMany({
    where: { ...where, imageUrls: { isEmpty: false } },
    include: { studio: true },
    orderBy: { createdAt: "desc" },
  });

  if (LIMIT) projects = projects.slice(0, LIMIT);

  console.log(`🖼 Фильтрация картинок: ${projects.length} проектов\n`);

  let totalKept = 0, totalRemoved = 0;

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    console.log(`  [${i + 1}/${projects.length}] ${p.title || "Без названия"} (${p.studio?.name || "—"}) — ${p.imageUrls.length} фото`);
    
    const before = p.imageUrls.length;
    await processProject(p);
    const after = (await prisma.project.findUnique({ where: { id: p.id } }))?.imageUrls.length || 0;
    totalKept += after;
    totalRemoved += (before - after);
  }

  console.log(`\n${"━".repeat(40)}`);
  console.log(`✅ Готово!`);
  console.log(`   Оставлено: ${totalKept}`);
  console.log(`   Удалено: ${totalRemoved}`);
  console.log(`${"━".repeat(40)}\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
