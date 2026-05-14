/**
 * Очистка проектов — БЕЗ AI, БЕЗ API, БЕСПЛАТНО.
 * 
 * 1. Удаляет мусорные картинки по URL-паттернам (лица, аватарки, баннеры)
 * 2. Объединяет проекты с одинаковыми названиями в рамках одной студии
 * 3. Удаляет проекты без картинок
 * 4. Удаляет дубликаты картинок внутри проекта
 * 
 * Запуск: node scripts/cleanup-projects.mjs
 *         node scripts/cleanup-projects.mjs --dry-run  (только показать что удалит)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

if (DRY_RUN) console.log("🔍 DRY RUN — ничего не меняем, только показываем\n");

// Паттерны мусорных картинок
const JUNK_PATTERNS = [
  // Люди/аватарки
  /team/i, /staff/i, /person/i, /avatar/i, /author/i, /about.*us/i,
  /sotrudn/i, /komand/i, /designer.*photo/i, /portrait/i, /face/i,
  /photo.*designer/i, /photo.*team/i, /nasha.*komanda/i,
  // Логотипы/иконки
  /logo/i, /icon/i, /favicon/i, /badge/i, /widget/i,
  // Технический мусор
  /placeholder/i, /spacer/i, /blank/i, /pixel/i, /1x1/i,
  /spinner/i, /loader/i, /tracking/i, /analytics/i,
  // Баннеры/реклама
  /banner/i, /advert/i, /promo.*banner/i,
  // SVG и мелкие
  /\.svg/i, /\.gif/i,
  // Социалки
  /facebook/i, /instagram/i, /vk\.com/i, /telegram/i, /whatsapp/i,
  /youtube.*thumb/i, /social/i,
];

// Паттерны мусорных названий проектов (не настоящие проекты)
const JUNK_TITLES = [
  /^страница проекта/i,
  /^описание проекта/i,
  /^проект дизайн/i,
  /^дизайн.?проект$/i,
  /^без названия$/i,
  /^null$/i,
  /^undefined$/i,
];

function isJunkImage(url) {
  return JUNK_PATTERNS.some(p => p.test(url));
}

function isJunkTitle(title) {
  if (!title) return true;
  return JUNK_TITLES.some(p => p.test(title.trim()));
}

async function step1_removeJunkImages() {
  console.log("━━━ Шаг 1: Удаление мусорных картинок по URL ━━━\n");
  
  const projects = await prisma.project.findMany({
    where: { imageUrls: { isEmpty: false } },
    select: { id: true, imageUrls: true, title: true },
  });

  let totalRemoved = 0;
  let projectsAffected = 0;

  for (const p of projects) {
    const clean = p.imageUrls.filter(url => !isJunkImage(url));
    const removed = p.imageUrls.length - clean.length;
    
    if (removed > 0) {
      if (!DRY_RUN) {
        await prisma.project.update({
          where: { id: p.id },
          data: { imageUrls: clean },
        });
      }
      totalRemoved += removed;
      projectsAffected++;
      if (projectsAffected <= 10) {
        const junk = p.imageUrls.filter(url => isJunkImage(url));
        console.log(`  "${(p.title || "—").slice(0, 40)}" — удалено ${removed}: ${junk[0]?.slice(0, 60)}...`);
      }
    }
  }

  console.log(`\n  📊 Удалено картинок: ${totalRemoved} из ${projectsAffected} проектов\n`);
  return totalRemoved;
}

async function step2_deduplicateImages() {
  console.log("━━━ Шаг 2: Удаление дубликатов картинок внутри проектов ━━━\n");

  const projects = await prisma.project.findMany({
    where: { imageUrls: { isEmpty: false } },
    select: { id: true, imageUrls: true },
  });

  let totalRemoved = 0;

  for (const p of projects) {
    const unique = [...new Set(p.imageUrls)];
    const removed = p.imageUrls.length - unique.length;
    if (removed > 0) {
      if (!DRY_RUN) {
        await prisma.project.update({
          where: { id: p.id },
          data: { imageUrls: unique },
        });
      }
      totalRemoved += removed;
    }
  }

  console.log(`  📊 Удалено дубликатов: ${totalRemoved}\n`);
  return totalRemoved;
}

async function step3_mergeByTitle() {
  console.log("━━━ Шаг 3: Объединение проектов с одинаковыми названиями ━━━\n");

  // Студии
  const studios = await prisma.studio.findMany({ select: { id: true, name: true } });
  let totalMerged = 0;
  let totalDeleted = 0;

  for (const studio of studios) {
    const projects = await prisma.project.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: "asc" },
    });

    // Группируем по нормализованному названию
    const groups = {};
    for (const p of projects) {
      const key = (p.title || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (!key || key.length < 3) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }

    for (const [title, group] of Object.entries(groups)) {
      if (group.length < 2) continue;

      // Объединяем все фото в первый проект
      const keeper = group[0];
      const allImages = new Set();
      for (const p of group) {
        for (const url of p.imageUrls) allImages.add(url);
      }

      if (!DRY_RUN) {
        await prisma.project.update({
          where: { id: keeper.id },
          data: { imageUrls: [...allImages].slice(0, 20) },
        });

        const toDelete = group.slice(1).map(p => p.id);
        await prisma.project.deleteMany({ where: { id: { in: toDelete } } });
        totalDeleted += toDelete.length;
      }
      totalMerged++;
      if (totalMerged <= 10) {
        console.log(`  "${title.slice(0, 50)}" (${studio.name}) — ${group.length} → 1`);
      }
    }
  }

  // Компании
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  for (const company of companies) {
    const projects = await prisma.project.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
    });

    const groups = {};
    for (const p of projects) {
      const key = (p.title || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (!key || key.length < 3) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }

    for (const [title, group] of Object.entries(groups)) {
      if (group.length < 2) continue;
      const keeper = group[0];
      const allImages = new Set();
      for (const p of group) {
        for (const url of p.imageUrls) allImages.add(url);
      }

      if (!DRY_RUN) {
        await prisma.project.update({
          where: { id: keeper.id },
          data: { imageUrls: [...allImages].slice(0, 20) },
        });
        const toDelete = group.slice(1).map(p => p.id);
        await prisma.project.deleteMany({ where: { id: { in: toDelete } } });
        totalDeleted += toDelete.length;
      }
      totalMerged++;
    }
  }

  console.log(`\n  📊 Объединено групп: ${totalMerged}, удалено записей: ${totalDeleted}\n`);
  return totalDeleted;
}

async function step4_removeEmpty() {
  console.log("━━━ Шаг 4: Удаление проектов без картинок ━━━\n");

  const empty = await prisma.project.findMany({
    where: { imageUrls: { isEmpty: true } },
    select: { id: true, title: true },
  });

  if (!DRY_RUN && empty.length > 0) {
    await prisma.project.deleteMany({
      where: { id: { in: empty.map(p => p.id) } },
    });
  }

  console.log(`  📊 Удалено пустых проектов: ${empty.length}\n`);
  return empty.length;
}

async function step5_updateCounts() {
  if (DRY_RUN) return;
  console.log("━━━ Шаг 5: Обновление счётчиков проектов ━━━\n");

  const studios = await prisma.studio.findMany({ select: { id: true } });
  for (const s of studios) {
    const count = await prisma.project.count({ where: { studioId: s.id } });
    await prisma.studio.update({ where: { id: s.id }, data: { projectCount: count } });
  }
  console.log(`  ✓ Обновлено ${studios.length} студий\n`);
}

async function main() {
  console.log("🧹 Очистка проектов (без AI, бесплатно)\n");

  const r1 = await step1_removeJunkImages();
  const r2 = await step2_deduplicateImages();
  const r3 = await step3_mergeByTitle();
  const r4 = await step4_removeEmpty();
  await step5_updateCounts();

  console.log(`${"━".repeat(40)}`);
  console.log(`✅ Итого:`);
  console.log(`   Мусорных картинок удалено: ${r1}`);
  console.log(`   Дубликатов картинок: ${r2}`);
  console.log(`   Проектов объединено/удалено: ${r3}`);
  console.log(`   Пустых проектов удалено: ${r4}`);
  console.log(`${"━".repeat(40)}\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
