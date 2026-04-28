import Link from "next/link";
import { prisma } from "../lib/prisma";

export const metadata = {
  title: "Подрядчики и производства — ПроектЛист",
  description: "Каталог проверенных подрядчиков и производств.",
};

export const dynamic = "force-dynamic";

const DEFAULT_PER_PAGE = 10;
const PER_PAGE_OPTIONS = [10, 50, 100];

export default async function ContractorsPage({ searchParams }) {
  const params = await searchParams;
  const perPage = PER_PAGE_OPTIONS.includes(parseInt(params?.perPage)) ? parseInt(params.perPage) : DEFAULT_PER_PAGE;
  const page = Math.max(1, parseInt(params?.page) || 1);
  const search = params?.q || "";
  const segment = params?.segment || "";
  const city = params?.city || "";
  const sort = params?.sort || "newest";
  const skip = (page - 1) * perPage;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(segment && { segment }),
    ...(city && { city }),
  };

  const orderBy = sort === "name" ? { name: "asc" } : { createdAt: "desc" };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({ where, orderBy, skip, take: perPage, include: { projects: { take: 1 } } }),
    prisma.company.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  function buildUrl(overrides) {
    const p = { page: "1", q: search, segment, city, sort, perPage: String(perPage), ...overrides };
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return `/contractors?${qs}`;
  }

  return (
    <div className="pt-24 pb-12">
      <main className="flex-1 px-8 lg:px-12 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-5xl font-extrabold tracking-tighter font-headline text-primary mb-4">Подрядчики и производства</h1>
          <p className="text-on-surface-variant">{total > 0 ? `${total} компаний` : "Каталог пока пуст"}</p>
        </header>

        <form className="mb-8 space-y-4">
          <div className="relative max-w-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input name="q" defaultValue={search} placeholder="Поиск по названию..." className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/40 text-lg" />
          </div>
          <div className="flex flex-wrap gap-3">
            <select name="segment" defaultValue={segment} className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm">
              <option value="">Все сегменты</option>
              <option value="medium">Средний</option>
              <option value="medium-plus">Средний+</option>
              <option value="premium">Премиум</option>
            </select>
            <select name="city" defaultValue={city} className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm">
              <option value="">Все города</option>
              <option value="Москва">Москва</option>
              <option value="Санкт-Петербург">Санкт-Петербург</option>
              <option value="Краснодар">Краснодар</option>
            </select>
            <select name="sort" defaultValue={sort} className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm">
              <option value="newest">Новые</option>
              <option value="name">По названию</option>
            </select>
            <button type="submit" className="hero-gradient text-on-primary px-6 py-2 rounded-lg font-bold text-sm">Найти</button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4">
          {companies.map((c) => (
            <article key={c.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all group">
              <div className="flex">
                <div className="w-40 flex-shrink-0 bg-slate-100 relative overflow-hidden self-stretch">
                  {c.logoUrl ? (
                    <img className="w-full h-full object-cover" alt={c.name} src={c.logoUrl} referrerPolicy="no-referrer" loading="lazy" />
                  ) : c.projects[0]?.imageUrls[0] ? (
                    <img className="w-full h-full object-cover" alt={c.name} src={c.projects[0].imageUrls[0]} referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[180px]">
                      <span className="material-symbols-outlined text-4xl text-slate-300">factory</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col min-w-0">
                  <h2 className="font-headline text-lg font-bold text-on-surface mb-1.5 truncate">{c.name}</h2>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {c.verified && <span className="bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">Проверен</span>}
                    {c.type && <span className="bg-slate-700 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">{c.type === "supplier" ? "Поставщик" : "Подрядчик"}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-[11px]">
                    {c.categories.length > 0 && (
                      <div>
                        <p className="uppercase font-bold text-slate-400 tracking-wider">Категории</p>
                        <p className="font-semibold text-on-surface text-xs">{c.categories.slice(0, 3).join(", ")}</p>
                      </div>
                    )}
                    {c.segment && (
                      <div>
                        <p className="uppercase font-bold text-slate-400 tracking-wider">Сегмент</p>
                        <p className="font-semibold text-on-surface text-xs">{c.segment === "premium" ? "Премиум" : c.segment === "medium-plus" ? "Средний+" : "Средний"}</p>
                      </div>
                    )}
                    {c.city && (
                      <div>
                        <p className="uppercase font-bold text-slate-400 tracking-wider">Город</p>
                        <p className="font-semibold text-on-surface text-xs">{c.city}</p>
                      </div>
                    )}
                    {c.website && (
                      <div>
                        <p className="uppercase font-bold text-slate-400 tracking-wider">Сайт</p>
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary text-xs hover:underline">{c.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>
                      </div>
                    )}
                  </div>
                  {c.description && <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{c.description}</p>}
                  <div className="mt-auto flex gap-2">
                    <Link href={`/company/${c.slug}`} className="hero-gradient text-white text-xs font-bold px-4 py-2 rounded transition-all hover:opacity-90">Профиль</Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {companies.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">factory</span>
              <p className="text-on-surface-variant text-lg">{search ? "Ничего не найдено" : "Пока нет подрядчиков"}</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">{skip + 1}-{Math.min(skip + perPage, total)} из {total}</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-slate-400">Показывать:</span>
                {PER_PAGE_OPTIONS.map((opt) => (
                  <Link key={opt} href={buildUrl({ perPage: String(opt), page: "1" })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${perPage === opt ? "bg-primary text-white" : "bg-slate-100 text-on-surface-variant hover:bg-slate-200"}`}>
                    {opt}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-1">
              {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100"><span className="material-symbols-outlined text-lg">arrow_back</span></Link>}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                if (totalPages <= 7) return i + 1;
                if (page <= 4) return i + 1;
                if (page >= totalPages - 3) return totalPages - 6 + i;
                return page - 3 + i;
              }).map((p) => (
                <Link key={p} href={buildUrl({ page: String(p) })} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${p === page ? "bg-primary text-white" : "hover:bg-slate-100"}`}>{p}</Link>
              ))}
              {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100"><span className="material-symbols-outlined text-lg">arrow_forward</span></Link>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
