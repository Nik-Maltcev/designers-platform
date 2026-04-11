import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const studio = await prisma.studio.findUnique({ where: { slug } });
  if (!studio) return { title: "Студия не найдена" };
  return {
    title: `${studio.name} — ПроектЛист`,
    description: studio.description || `Профиль студии ${studio.name}`,
  };
}

export default async function StudioPage({ params }) {
  const { slug } = await params;
  const studio = await prisma.studio.findUnique({
    where: { slug },
    include: { projects: true, companyData: true, reviewSummary: true },
  });

  if (!studio) notFound();

  return (
    <main className="pt-24 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      <header className="mb-12">
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-4">
          <Link href="/designers" className="hover:text-primary transition-colors">Дизайнеры</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">{studio.name}</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline">{studio.name}</h1>
              {studio.verified && (
                <div className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                  Проверен
                </div>
              )}
            </div>
            {studio.description && (
              <p className="text-on-surface-variant max-w-2xl leading-relaxed">{studio.description}</p>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            О студии
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {studio.city && (
              <div>
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Город</span>
                <span className="text-on-surface font-semibold">{studio.city}</span>
              </div>
            )}
            {studio.inn && (
              <div>
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">ИНН</span>
                <span className="text-on-surface font-semibold font-mono">{studio.inn}</span>
              </div>
            )}
            <div>
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Проектов</span>
              <span className="text-on-surface font-semibold">{studio.projectCount}</span>
            </div>
            {studio.segment && (
              <div>
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Сегмент</span>
                <span className="text-on-surface font-semibold">{studio.segment === "premium" ? "Премиум" : studio.segment === "medium-plus" ? "Средний+" : "Средний"}</span>
              </div>
            )}
            {studio.website && (
              <div>
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Сайт</span>
                <a href={studio.website} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">{studio.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          {studio.objectTypes.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Типы объектов</h3>
              <div className="flex flex-wrap gap-2">
                {studio.objectTypes.map((t) => (
                  <span key={t} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">{t}</span>
                ))}
              </div>
            </div>
          )}
          {studio.services.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Услуги</h3>
              <div className="flex flex-wrap gap-2">
                {studio.services.map((s) => (
                  <span key={s} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {studio.companyData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-surface-container-low p-8 rounded-xl">
            <h3 className="text-xl font-bold mb-6 font-headline">Финансовые данные</h3>
            <div className="space-y-4">
              {studio.companyData.revenue && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div>
                    <span className="text-xs text-outline uppercase font-bold tracking-wider">Выручка</span>
                    <p className="text-lg font-bold text-on-surface">{Number(studio.companyData.revenue).toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
                </div>
              )}
              {studio.companyData.profit && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div>
                    <span className="text-xs text-outline uppercase font-bold tracking-wider">Чистая прибыль</span>
                    <p className="text-lg font-bold text-on-surface">{Number(studio.companyData.profit).toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
                </div>
              )}
              {studio.companyData.employees && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div>
                    <span className="text-xs text-outline uppercase font-bold tracking-wider">Сотрудников</span>
                    <p className="text-lg font-bold text-on-surface">{studio.companyData.employees}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">groups</span>
                </div>
              )}
              {studio.companyData.registrationDate && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div>
                    <span className="text-xs text-outline uppercase font-bold tracking-wider">Дата регистрации</span>
                    <p className="text-sm font-semibold text-on-surface">{studio.companyData.registrationDate}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
            <h3 className="text-xl font-bold mb-6 font-headline">Проверка контрагента</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <span className="text-xs text-outline uppercase font-bold">Судебные дела</span>
                  <p className="text-sm font-semibold">{studio.companyData.courtCasesCount} дел</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold uppercase ${studio.companyData.courtCasesCount === 0 ? "text-teal-600" : "text-amber-600"}`}>
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{studio.companyData.courtCasesCount === 0 ? "check_circle" : "warning"}</span>
                  {studio.companyData.courtCasesCount === 0 ? "Нет" : "Есть"}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <span className="text-xs text-outline uppercase font-bold">Госконтракты</span>
                  <p className="text-sm font-semibold">{studio.companyData.contractsCount} контрактов</p>
                </div>
                <span className="material-symbols-outlined text-primary text-sm">description</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <span className="text-xs text-outline uppercase font-bold">Исполнительные производства</span>
                  <p className="text-sm font-semibold">{studio.companyData.enforcementsCount} производств</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold uppercase ${studio.companyData.enforcementsCount === 0 ? "text-teal-600" : "text-red-600"}`}>
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{studio.companyData.enforcementsCount === 0 ? "check_circle" : "error"}</span>
                  {studio.companyData.enforcementsCount === 0 ? "Нет" : "Есть"}
                </div>
              </div>
              {studio.companyData.status && (
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                  <div>
                    <span className="text-xs text-outline uppercase font-bold">Статус организации</span>
                    <p className="text-sm font-semibold">{studio.companyData.status}</p>
                  </div>
                  <span className="material-symbols-outlined text-teal-600 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                </div>
              )}
              <p className="text-[10px] text-outline mt-2">Данные актуальны на {new Date(studio.companyData.fetchedAt).toLocaleDateString("ru-RU")}</p>
            </div>
          </div>
        </div>
      )}

      {studio.reviewSummary && (studio.reviewSummary.summary || (Array.isArray(studio.reviewSummary.sources) && studio.reviewSummary.sources.length > 0)) && (
        <div className="bg-surface-container-lowest p-8 rounded-xl mb-16 border border-outline-variant/15">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">reviews</span>
              Отзывы
            </h3>
            {studio.reviewSummary.avgRating && (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-on-surface">{studio.reviewSummary.avgRating.toFixed(1)}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1", color: star <= Math.round(studio.reviewSummary.avgRating) ? "#f59e0b" : "#d1d5db" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-outline">{studio.reviewSummary.totalReviews} отзывов</p>
                </div>
              </div>
            )}
          </div>

          {studio.reviewSummary.summary && (
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{studio.reviewSummary.summary}</p>
          )}

          {(studio.reviewSummary.positives.length > 0 || studio.reviewSummary.negatives.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {studio.reviewSummary.positives.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-bold text-teal-600 tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                    Плюсы
                  </p>
                  <ul className="space-y-1.5">
                    {studio.reviewSummary.positives.map((p, i) => (
                      <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {studio.reviewSummary.negatives.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-bold text-amber-600 tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
                    Минусы
                  </p>
                  <ul className="space-y-1.5">
                    {studio.reviewSummary.negatives.map((n, i) => (
                      <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">−</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {Array.isArray(studio.reviewSummary.sources) && studio.reviewSummary.sources.length > 0 && (
            <>
              <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-3">Площадки с отзывами</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {studio.reviewSummary.sources.map((source, i) => (
                  <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-outline-variant/10 hover:shadow-md hover:border-primary/20 transition-all group">
                    <span className="text-xl">{source.icon || "⭐"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{source.platform}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {source.rating && (
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            {source.rating}
                          </span>
                        )}
                        {source.reviewCount && (
                          <span className="text-xs text-outline">{source.reviewCount} отзывов</span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm transition-colors">open_in_new</span>
                  </a>
                ))}
              </div>
            </>
          )}

          {Array.isArray(studio.reviewSummary.reviews) && studio.reviewSummary.reviews.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4">Тексты отзывов</h4>
              <div className="space-y-3">
                {studio.reviewSummary.reviews.map((review, i) => (
                  <div key={i} className="p-4 bg-surface rounded-lg border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        <span className="text-sm font-semibold text-on-surface">{review.author || "Аноним"}</span>
                        {review.platform && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{review.platform}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {review.rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: "'FILL' 1", color: star <= review.rating ? "#f59e0b" : "#d1d5db" }}>
                                star
                              </span>
                            ))}
                          </div>
                        )}
                        {review.date && <span className="text-[10px] text-outline">{review.date}</span>}
                      </div>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-outline mt-4">Данные собраны {new Date(studio.reviewSummary.fetchedAt).toLocaleDateString("ru-RU")} из открытых источников</p>
        </div>
      )}

      {studio.projects.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-8">Проекты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studio.projects.map((project) => (
              <div key={project.id} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest mb-4 relative">
                  {project.imageUrls[0] ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={project.title} src={project.imageUrls[0]} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline">image</span>
                    </div>
                  )}
                  {project.year && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <span className="text-white font-bold">{project.year} · {project.objectType || "Интерьер"}</span>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{project.title}</h4>
                {project.description && (
                  <p className="text-sm text-on-surface-variant line-clamp-2">{project.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
