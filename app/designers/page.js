import Link from "next/link";
import { prisma } from "../lib/prisma";

export const metadata = {
  title: "Дизайнеры и архитекторы — ПроектЛист",
  description: "Каталог верифицированных дизайнеров, архитекторов и комплектаторов.",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function DesignersPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page) || 1);
  const skip = (page - 1) * PER_PAGE;

  const [studios, total] = await Promise.all([
    prisma.studio.findMany({
      orderBy: { projectCount: "desc" },
      skip,
      take: PER_PAGE,
      include: { projects: { take: 1 } },
    }),
    prisma.studio.count(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="pt-24 pb-12">
      <main className="flex-1 px-8 lg:px-12 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface mb-4">
            Дизайнеры, архитекторы и комплектаторы
          </h1>
          <p className="text-on-surface-variant max-w-2xl">
            {total > 0 ? `${total} студий в каталоге. Страница ${page} из ${totalPages}.` : "Каталог загружается."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {studios.map((studio) => (
            <article key={studio.id} className="bg-surface-container-lowest p-8 rounded-xl flex flex-col md:flex-row gap-8 hover:bg-surface-container-low transition-all duration-500 group">
              <div className="w-full md:w-56 h-48 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                {studio.imageUrl ? (
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={studio.name} src={studio.imageUrl} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline">apartment</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-primary mb-1">{studio.name}</h2>
                    <div className="flex gap-2 flex-wrap">
                      {studio.verified && (
                        <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Проверен</span>
                      )}
                      {studio.city && (
                        <span className="flex items-center gap-1 text-xs text-outline">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {studio.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {studio.description && <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{studio.description}</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 mb-6">
                  {studio.objectTypes.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Тип объекта</p>
                      <p className="text-sm font-semibold">{studio.objectTypes.slice(0, 2).join(", ")}</p>
                    </div>
                  )}
                  {studio.segment && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p>
                      <p className="text-sm font-semibold">{studio.segment === "premium" ? "Премиум" : studio.segment === "medium-plus" ? "Средний+" : "Средний"}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Проекты</p>
                    <p className="text-sm font-semibold">{studio.projectCount}</p>
                  </div>
                  {studio.website && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сайт</p>
                      <a href={studio.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate block">{studio.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>
                    </div>
                  )}
                </div>
                <div className="mt-auto">
                  <Link href={`/studio/${studio.slug}`} className="bg-surface-container-high text-primary text-xs font-bold px-4 py-2.5 rounded-md hover:bg-surface-container-highest transition-colors">Открыть профиль</Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-between border-t border-outline-variant pt-8">
            <span className="text-xs font-bold text-outline tracking-widest uppercase">
              Показано {skip + 1}-{Math.min(skip + PER_PAGE, total)} из {total}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/designers?page=${page - 1}`} className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors">← Назад</Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <Link key={p} href={`/designers?page=${p}`} className={`px-3 py-2 rounded-lg text-sm font-bold ${p === page ? "bg-primary text-on-primary" : "bg-surface-container-high hover:bg-surface-container-highest"}`}>{p}</Link>
                );
              })}
              {totalPages > 7 && <span className="px-2 py-2 text-outline">...</span>}
              {page < totalPages && (
                <Link href={`/designers?page=${page + 1}`} className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors">Далее →</Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
