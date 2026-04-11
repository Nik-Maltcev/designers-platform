import Link from "next/link";
import { prisma } from "../lib/prisma";

export const metadata = {
  title: "Дизайнеры и архитекторы — ПроектЛист",
  description: "Каталог верифицированных дизайнеров, архитекторов и комплектаторов.",
};

export const dynamic = "force-dynamic";

const DEFAULT_PER_PAGE = 10;
const PER_PAGE_OPTIONS = [10, 50, 100];

const OBJECT_TYPES = ["Квартиры", "Дома", "Офисы", "HoReCa", "Клиники"];
const CITIES = ["Москва", "МО", "СПб", "Вся Россия"];
const SEGMENTS = ["medium", "medium-plus", "premium"];
const SERVICES = ["Дизайн-проект", "Комплектация", "Авторский надзор"];

function segmentLabel(s) {
  if (s === "premium") return "Premium";
  if (s === "medium-plus") return "Medium+";
  return "Medium";
}

export default async function DesignersPage({ searchParams }) {
  const params = await searchParams;
  const perPage = PER_PAGE_OPTIONS.includes(parseInt(params?.perPage)) ? parseInt(params.perPage) : DEFAULT_PER_PAGE;
  const page = Math.max(1, parseInt(params?.page) || 1);
  const search = params?.q || "";
  const segment = params?.segment || "";
  const city = params?.city || "";
  const objectType = params?.objectType || "";
  const sort = params?.sort || "projects";
  const verifiedOnly = params?.verified === "1";
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
    ...(objectType && { objectTypes: { has: objectType } }),
    ...(verifiedOnly && { verified: true }),
  };

  const orderBy = sort === "name" ? { name: "asc" } : sort === "newest" ? { createdAt: "desc" } : { projectCount: "desc" };

  const [studios, total] = await Promise.all([
    prisma.studio.findMany({ where, orderBy, skip, take: perPage, include: { projects: { take: 2 } } }),
    prisma.studio.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  function buildUrl(overrides) {
    const p = { page: "1", q: search, segment, city, objectType, sort, verified: verifiedOnly ? "1" : "", perPage: String(perPage), ...overrides };
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return `/designers?${qs}`;
  }

  return (
    <div className="pt-24 pb-12">
      <div className="flex max-w-[1400px] mx-auto px-6 lg:px-10 gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0 pt-2">
          <form>
            <input type="hidden" name="sort" value={sort} />

            {/* Object Type */}
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface mb-3">Тип объекта</h3>
              <div className="space-y-2">
                {OBJECT_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="objectType" value={t} defaultChecked={objectType === t}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                    <span className="text-sm text-on-surface-variant group-hover:text-on-surface">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Geography */}
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface mb-3">География</h3>
              <div className="space-y-2">
                {CITIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="city" value={c === "Вся Россия" ? "" : c}
                      defaultChecked={city === c || (c === "Вся Россия" && !city)}
                      className="w-4 h-4 border-slate-300 text-primary focus:ring-primary/30" />
                    <span className={`text-sm ${city === c ? "font-semibold text-on-surface bg-primary text-white px-3 py-1 rounded-md -ml-1" : "text-on-surface-variant group-hover:text-on-surface"}`}>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Segment */}
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface mb-3">Сегмент</h3>
              <div className="space-y-2">
                {SEGMENTS.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <span className={`text-sm px-4 py-1.5 rounded-full border cursor-pointer transition-all ${segment === s ? "border-primary bg-primary text-white font-semibold" : "border-slate-200 text-on-surface-variant hover:border-slate-400"}`}>
                      {segmentLabel(s)}
                    </span>
                    <input type="radio" name="segment" value={s} defaultChecked={segment === s} className="sr-only" />
                  </label>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface mb-3">Услуги</h3>
              <div className="space-y-2">
                {SERVICES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                    <span className="text-sm text-on-surface-variant group-hover:text-on-surface">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verified toggle */}
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface mb-3">Активность</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  Verified Only
                </span>
                <input type="hidden" name="verified" value={verifiedOnly ? "1" : "0"} />
                <div className={`w-10 h-5 rounded-full relative transition-colors ${verifiedOnly ? "bg-primary" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${verifiedOnly ? "left-5" : "left-0.5"}`}></div>
                </div>
              </label>
            </div>

            <button type="submit" className="w-full hero-gradient text-on-primary py-2.5 rounded-lg font-bold text-sm">Применить</button>
          </form>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <header className="mb-8">
            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tighter text-on-surface mb-3">
              Дизайнеры, архитекторы и комплектаторы
            </h1>
            <p className="text-on-surface-variant text-sm max-w-2xl">
              Профессиональное сообщество верифицированных экспертов. Используйте расширенные фильтры для подбора партнера по архитектурным и интерьерным задачам любого масштаба.
            </p>
          </header>

          {/* Sort tabs */}
          <div className="flex items-center gap-1 mb-8 text-sm">
            <span className="text-on-surface-variant mr-2">Сортировать по:</span>
            {[
              { key: "projects", label: "Сходство проектов" },
              { key: "newest", label: "Активность" },
              { key: "name", label: "Масштаб" },
            ].map((s) => (
              <Link key={s.key} href={buildUrl({ sort: s.key })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${sort === s.key ? "bg-primary text-white" : "text-on-surface-variant hover:bg-slate-100"}`}>
                {s.label}
              </Link>
            ))}
          </div>

          {/* Studio Cards — single column */}
          <div className="grid grid-cols-1 gap-4">
            {studios.map((studio) => (
              <article key={studio.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all group">
                <div className="flex">
                  {/* Image */}
                  <div className="w-40 flex-shrink-0 bg-slate-100 relative overflow-hidden self-stretch">
                    {studio.imageUrl ? (
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={studio.name} src={studio.imageUrl} loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[180px]">
                        <span className="material-symbols-outlined text-4xl text-slate-300">apartment</span>
                      </div>
                    )}
                    {/* Bookmark */}
                    <button className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded flex items-center justify-center hover:bg-white transition-colors" aria-label="Добавить в избранное">
                      <span className="material-symbols-outlined text-lg text-slate-500">bookmark</span>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col min-w-0">
                    <h2 className="font-headline text-lg font-bold text-on-surface mb-1.5 truncate">{studio.name}</h2>

                    {/* Badges */}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {studio.verified && (
                        <span className="bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">Проверен</span>
                      )}
                      {studio.active && (
                        <span className="bg-slate-700 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">Активен</span>
                      )}
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-[11px]">
                      {studio.objectTypes.length > 0 && (
                        <div>
                          <p className="uppercase font-bold text-slate-400 tracking-wider">Тип объекта</p>
                          <p className="font-semibold text-on-surface text-xs">{studio.objectTypes.slice(0, 2).join(", ")}</p>
                        </div>
                      )}
                      {studio.segment && (
                        <div>
                          <p className="uppercase font-bold text-slate-400 tracking-wider">Сегмент</p>
                          <p className="font-semibold text-on-surface text-xs">{segmentLabel(studio.segment)}</p>
                        </div>
                      )}
                      <div>
                        <p className="uppercase font-bold text-slate-400 tracking-wider">Проекты</p>
                        <p className="font-semibold text-on-surface text-xs">{studio.projectCount}</p>
                      </div>
                      {studio.city && (
                        <div>
                          <p className="uppercase font-bold text-slate-400 tracking-wider">Город</p>
                          <p className="font-semibold text-on-surface text-xs">{studio.city}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex gap-2">
                      <Link href={`/studio/${studio.slug}`}
                        className="hero-gradient text-white text-xs font-bold px-4 py-2 rounded transition-all hover:opacity-90">
                        Контакты/Пригласить
                      </Link>
                      <Link href={`/studio/${studio.slug}`}
                        className="border border-slate-200 text-on-surface text-xs font-medium px-4 py-2 rounded hover:bg-slate-50 transition-colors">
                        Профиль
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {studios.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">apartment</span>
              <p className="text-on-surface-variant text-lg">{search ? "Ничего не найдено" : "Каталог загружается"}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                  {skip + 1}-{Math.min(skip + perPage, total)} из {total}
                </span>
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
                {page > 1 && (
                  <Link href={buildUrl({ page: String(page - 1) })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) { p = i + 1; }
                  else if (page <= 4) { p = i + 1; }
                  else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
                  else { p = page - 3 + i; }
                  return p;
                }).map((p) => (
                  <Link key={p} href={buildUrl({ page: String(p) })}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${p === page ? "bg-primary text-white" : "hover:bg-slate-100"}`}>
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={buildUrl({ page: String(page + 1) })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100">
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
