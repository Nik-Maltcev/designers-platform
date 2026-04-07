import Link from "next/link";
import { prisma } from "../lib/prisma";

export const metadata = {
  title: "Подрядчики и производства — ПроектЛист",
  description: "Каталог проверенных подрядчиков и производств.",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function ContractorsPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page) || 1);
  const search = params?.q || "";
  const segment = params?.segment || "";
  const city = params?.city || "";
  const sort = params?.sort || "newest";
  const skip = (page - 1) * PER_PAGE;

  const where = {
    role: "contractor",
    profileFilled: true,
    ...(search && {
      OR: [
        { companyName: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(segment && { segment }),
    ...(city && { city }),
  };

  const orderBy = sort === "name" ? { companyName: "asc" } : { createdAt: "desc" };

  const [contractors, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy, skip, take: PER_PAGE }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(overrides) {
    const p = { page: String(page), q: search, segment, city, sort, ...overrides };
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

        {/* Search + Filters */}
        <form className="mb-8 space-y-4">
          <div className="relative max-w-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input name="q" defaultValue={search} placeholder="Поиск по названию..." className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/40 text-lg" />
          </div>
          <div className="flex flex-wrap gap-3">
            <select name="segment" defaultValue={segment} className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm">
              <option value="">Все сегменты</option>
              <option value="Средний">Средний</option>
              <option value="Средний+">Средний+</option>
              <option value="Премиум">Премиум</option>
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

        {/* Results */}
        <div className="grid grid-cols-1 gap-8">
          {contractors.map((c) => (
            <article key={c.id} className="bg-surface-container-lowest rounded-xl p-8 hover:bg-surface-container-low transition-all">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-extrabold font-headline">{c.companyName || c.name}</h2>
                {c.verified && (
                  <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Проверен
                  </span>
                )}
              </div>
              {c.description && <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{c.description}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {c.city && <div><p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Регион</p><p className="text-sm font-semibold">{c.city}</p></div>}
                {c.segment && <div><p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p><p className="text-sm font-semibold">{c.segment}</p></div>}
                {(c.hasProduction || c.hasInstallation) && <div><p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Возможности</p><p className="text-sm font-semibold">{[c.hasProduction && "Производство", c.hasInstallation && "Монтаж"].filter(Boolean).join(", ")}</p></div>}
                {c.minBudget && <div><p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Мин. чек</p><p className="text-sm font-semibold">{c.minBudget}</p></div>}
              </div>
              {c.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {c.categories.map((cat) => (<span key={cat} className="bg-surface-container px-2.5 py-1 rounded-full text-xs font-medium">{cat}</span>))}
                </div>
              )}
              <div className="mt-4">
                <Link href={`/contractor/${c.id}`} className="bg-surface-container-high text-primary text-xs font-bold px-4 py-2.5 rounded-md hover:bg-surface-container-highest transition-colors">Открыть профиль</Link>
              </div>
            </article>
          ))}
          {contractors.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">engineering</span>
              <p className="text-on-surface-variant text-lg mb-4">{search ? "Ничего не найдено" : "Пока нет подрядчиков"}</p>
              <Link href="/login" className="inline-block hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">Зарегистрироваться</Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-between border-t border-outline-variant pt-8">
            <span className="text-xs font-bold text-outline tracking-widest uppercase">Показано {skip + 1}-{Math.min(skip + PER_PAGE, total)} из {total}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold">← Назад</Link>}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={buildUrl({ page: String(p) })} className={`px-3 py-2 rounded-lg text-sm font-bold ${p === page ? "bg-primary text-on-primary" : "bg-surface-container-high"}`}>{p}</Link>
              ))}
              {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold">Далее →</Link>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
