/**
 * Дедупликация проектов студий через DeepSeek.
 * Группирует проекты одной студии, спрашивает AI какие из них — один и тот же проект.
 * Объединяет дубли: все фото в один imageUrls, удаляет лишние записи.
 * 
 * Запуск: node scripts/dedup-projects.mjs
 *         node scripts/dedup-projects.mjs --limit=20
 *         node scripts/dedup-projects.mjs --studio="Arch Detali"
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_KEY) { console.error("❌ DEEPSEEK_API_KEY не задан"); process.exit(1); }

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : null;
const studioArg = args.find(a => a.startsWith("--studio="));
const STUDIO_NAME = studioArg ? studioArg.split("=").slice(1).join("=") : null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function askDeepSeek(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Отвечай ТОЛЬКО валидным JSON без markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0,
          max_tokens: 2000,
        }),
      });
      if (res.status === 429) {
        await sleep(attempt * 10000);
        continue;
      }
      if (!res.ok) {
        console.log(`  ⚠ DeepSeek ${res.status}`);
        return null;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      if (attempt < 3) { await sleep(3000); continue; }
      console.log(`  ✗ AI: ${err.message}`);
      return null;
    }
  }
  return null;
}

async function processStudio(studio) {
  const projects = await prisma.project.findMany({
    where: { studioId: studio.id },
    orderBy: { createdAt: "asc" },
  });

  if (projects.length <= 1) return { merged: 0, deleted: 0 };

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`→ ${studio.name} (${projects.length} проектов)`);

  // Формируем список для AI
  const projectList = projects.map((p, i) => ({
    id: i,
    title: p.title || "Без названия",
    description: (p.description || "").slice(0, 100),
    images: p.imageUrls.length,
    firstImage: p.imageUrls[0] || "",
  }));

  const prompt = `У дизайн-студии "${studio.name}" есть ${projects.length} проектов. Определи какие из них — ДУБЛИКАТЫ (один и тот же проект, разбитый на несколько записей).

Признаки дубликата:
- Похожие или одинаковые названия
- Одинаковые или очень похожие URL картинок
- Описания об одном и том же объекте

Список проектов:
${projectList.map(p => `[${p.id}] "${p.title}" — ${p.description || "нет описания"} (${p.images} фото, img: ${p.firstImage.slice(-50)})`).join("\n")}

Верни JSON: {"groups": [[0, 3, 5], [1, 2]], "unique": [4, 6, 7]}
- groups: массив групп дубликатов (индексы проектов которые надо объединить)
- unique: индексы уникальных проектов (не дубли)

Если дубликатов нет — верни {"groups": [], "unique": [0,1,2,...]}`;

  const result = await askDeepSeek(prompt);
  await sleep(1000);

  if (!result || !result.groups) {
    console.log(`  ⚠ AI не определил дубли`);
    return { merged: 0, deleted: 0 };
  }

  if (result.groups.length === 0) {
    console.log(`  ✓ Дубликатов нет`);
    return { merged: 0, deleted: 0 };
  }

  let totalDeleted = 0;

  for (const group of result.groups) {
    if (group.length < 2) continue;

    const groupProjects = group.map(i => projects[i]).filter(Boolean);
    if (groupProjects.length < 2) continue;

    // Оставляем первый, объединяем фото
    const keeper = groupProjects[0];
    const allImages = [];
    const seen = new Set();

    for (const p of groupProjects) {
      for (const url of p.imageUrls) {
        if (!seen.has(url)) {
          seen.add(url);
          allImages.push(url);
        }
      }
    }

    // Обновляем keeper
    await prisma.project.update({
      where: { id: keeper.id },
      data: { imageUrls: allImages.slice(0, 20) },
    });

    // Удаляем остальные
    const toDelete = groupProjects.slice(1).map(p => p.id);
    await prisma.project.deleteMany({ where: { id: { in: toDelete } } });

    totalDeleted += toDelete.length;
    console.log(`  🔗 "${keeper.title}" — объединено ${groupProjects.length} записей (${allImages.length} фото), удалено ${toDelete.length}`);
  }

  // Обновляем projectCount
  const remaining = await prisma.project.count({ where: { studioId: studio.id } });
  await prisma.studio.update({ where: { id: studio.id }, data: { projectCount: remaining } });

  console.log(`  ✅ Итого: удалено ${totalDeleted} дублей, осталось ${remaining} проектов`);
  return { merged: result.groups.length, deleted: totalDeleted };
}

async function main() {
  let where = {};
  if (STUDIO_NAME) {
    where.name = { contains: STUDIO_NAME, mode: "insensitive" };
  }

  let studios = await prisma.studio.findMany({
    where,
    orderBy: { projectCount: "desc" },
  });

  if (LIMIT) studios = studios.slice(0, LIMIT);

  console.log(`🔍 Дедупликация проектов: ${studios.length} студий\n`);

  let totalMerged = 0, totalDeleted = 0;

  for (const studio of studios) {
    const { merged, deleted } = await processStudio(studio);
    totalMerged += merged;
    totalDeleted += deleted;
  }

  console.log(`\n${"━".repeat(40)}`);
  console.log(`✅ Готово!`);
  console.log(`   Групп дублей: ${totalMerged}`);
  console.log(`   Удалено записей: ${totalDeleted}`);
  console.log(`${"━".repeat(40)}\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
