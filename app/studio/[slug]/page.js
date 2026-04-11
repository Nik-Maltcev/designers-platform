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

      {studio.companyData && (() => {
        const cd = studio.companyData;
        const ck = cd.rawCheckko || {};
        const dn = cd.rawDataNewton || {};
        const company = ck.company || dn.company || {};
        const finances = ck.finances;
        const finDocs = Array.isArray(finances?.Документы) ? finances.Документы : Array.isArray(finances) ? finances : [];
        const arbDn = dn.arbitration?.data || [];
        const leases = dn.leases?.data || [];
        const vacancies = dn.vacancies?.data || [];
        const products = dn.products?.data || [];
        const inspections = ck.inspections;
        const inspArr = Array.isArray(inspections?.Документы) ? inspections.Документы : Array.isArray(inspections) ? inspections : [];
        const bankData = ck.bank;
        const fedresurs = ck.fedresurs;
        const fedArr = Array.isArray(fedresurs?.Документы) ? fedresurs.Документы : Array.isArray(fedresurs) ? fedresurs : [];
        const bankruptcyMsgs = ck.bankruptcyMsgs;
        const bankrArr = Array.isArray(bankruptcyMsgs?.Документы) ? bankruptcyMsgs.Документы : Array.isArray(bankruptcyMsgs) ? bankruptcyMsgs : [];
        const enfArr = Array.isArray(cd.enforcements) ? cd.enforcements : [];
        const courtArr = Array.isArray(cd.courtCases) ? cd.courtCases : [];
        const contractsArr = Array.isArray(cd.contracts) ? cd.contracts : [];

        return (
        <div className="space-y-8 mb-16">
          {/* Основная информация */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
            <h3 className="text-xl font-bold mb-6 font-headline">Информация о компании</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cd.fullName && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold mb-1">Полное название</span><span className="text-sm font-semibold">{cd.fullName}</span></div>}
              {cd.director && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Руководитель / ФИО ИП</span><span className="text-sm font-semibold">{cd.director}</span></div>}
              {(company.name || company.НаимСокр) && !cd.director && <div><span className="block text-xs text-outline uppercase font-bold mb-1">ФИО / Название</span><span className="text-sm font-semibold">{company.name || company.НаимСокр}</span></div>}
              {cd.ogrn && <div><span className="block text-xs text-outline uppercase font-bold mb-1">ОГРН</span><span className="text-sm font-semibold font-mono">{cd.ogrn}</span></div>}
              {cd.status && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Статус</span><span className={`text-sm font-semibold ${cd.status === "Действует" || company.active ? "text-teal-600" : "text-red-600"}`}>{cd.status}</span></div>}
              {(cd.registrationDate || company.establishment_date || company.ДатаРег) && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Дата регистрации</span><span className="text-sm font-semibold">{cd.registrationDate || company.establishment_date || company.ДатаРег}</span></div>}
              {cd.address && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold mb-1">Адрес</span><span className="text-sm font-semibold">{cd.address}</span></div>}
              {(company.activity_kind_dsc || company.ОКВЭД) && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold mb-1">Вид деятельности (ОКВЭД)</span><span className="text-sm font-semibold">{company.activity_kind_dsc || company.ОКВЭД} {company.activity_kind ? `(${company.activity_kind})` : ""}</span></div>}
              {cd.employees && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Сотрудников</span><span className="text-sm font-semibold">{cd.employees}</span></div>}
              {(company.type || company.ОПФ) && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Тип</span><span className="text-sm font-semibold">{company.type === "ip" ? "ИП" : company.type === "ul" ? "ЮЛ" : company.ОПФ || company.type}</span></div>}
            </div>
          </div>


          {/* Финансы + Проверка контрагента */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Финансы */}
            <div className="bg-surface-container-low p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-6 font-headline">Финансовые данные</h3>
              <div className="space-y-3">
                {cd.revenue && <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm"><div><span className="text-xs text-outline uppercase font-bold">Выручка</span><p className="text-lg font-bold">{Number(cd.revenue).toLocaleString("ru-RU")} ₽</p></div><span className="material-symbols-outlined text-primary text-xl">trending_up</span></div>}
                {cd.profit && <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm"><div><span className="text-xs text-outline uppercase font-bold">Чистая прибыль</span><p className="text-lg font-bold">{Number(cd.profit).toLocaleString("ru-RU")} ₽</p></div><span className="material-symbols-outlined text-primary text-xl">account_balance</span></div>}
                {finDocs.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-outline uppercase font-bold mb-2">Финансовая отчётность по годам</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {finDocs.slice(0, 10).map((doc, i) => (
                        <div key={i} className="text-xs p-2 bg-white rounded border border-slate-100">
                          <span className="font-bold">{doc.Год || doc.year || `Период ${i + 1}`}</span>
                          {(doc.Выручка || doc["2110"]) && <span className="ml-2">Выручка: {Number(doc.Выручка || doc["2110"]).toLocaleString("ru-RU")} ₽</span>}
                          {(doc.ЧистаяПрибыль || doc["2400"]) && <span className="ml-2">Прибыль: {Number(doc.ЧистаяПрибыль || doc["2400"]).toLocaleString("ru-RU")} ₽</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Проверка контрагента */}
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
              <h3 className="text-xl font-bold mb-6 font-headline">Проверка контрагента</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-surface rounded-lg">
                  <div><span className="text-xs text-outline uppercase font-bold">Судебные дела</span><p className="text-sm font-semibold">{cd.courtCasesCount} дел</p></div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${cd.courtCasesCount === 0 ? "text-teal-600" : "text-amber-600"}`}>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{cd.courtCasesCount === 0 ? "check_circle" : "warning"}</span>
                    {cd.courtCasesCount === 0 ? "Нет" : "Есть"}
                  </div>
                </div>
                <div className="flex justify-between p-3 bg-surface rounded-lg">
                  <div><span className="text-xs text-outline uppercase font-bold">Госконтракты</span><p className="text-sm font-semibold">{cd.contractsCount} контрактов</p></div>
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                </div>
                <div className="flex justify-between p-3 bg-surface rounded-lg">
                  <div><span className="text-xs text-outline uppercase font-bold">Исполнительные производства</span><p className="text-sm font-semibold">{cd.enforcementsCount} производств</p></div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${cd.enforcementsCount === 0 ? "text-teal-600" : "text-red-600"}`}>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{cd.enforcementsCount === 0 ? "check_circle" : "error"}</span>
                    {cd.enforcementsCount === 0 ? "Нет" : "Есть"}
                  </div>
                </div>
                {inspArr.length > 0 && <div className="flex justify-between p-3 bg-surface rounded-lg"><div><span className="text-xs text-outline uppercase font-bold">Проверки</span><p className="text-sm font-semibold">{inspArr.length}</p></div><span className="material-symbols-outlined text-primary text-sm">fact_check</span></div>}
                {bankrArr.length > 0 && <div className="flex justify-between p-3 bg-surface rounded-lg"><div><span className="text-xs text-outline uppercase font-bold">Сообщения о банкротстве</span><p className="text-sm font-semibold">{bankrArr.length}</p></div><span className="material-symbols-outlined text-red-600 text-sm">dangerous</span></div>}
                {fedArr.length > 0 && <div className="flex justify-between p-3 bg-surface rounded-lg"><div><span className="text-xs text-outline uppercase font-bold">Федресурс</span><p className="text-sm font-semibold">{fedArr.length} записей</p></div><span className="material-symbols-outlined text-primary text-sm">article</span></div>}
              </div>
            </div>
          </div>

          {/* Арбитражные дела (DataNewton) */}
          {arbDn.length > 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
              <h3 className="text-lg font-bold mb-4 font-headline">Арбитражные дела ({arbDn.length})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {arbDn.slice(0, 30).map((c, i) => (
                  <div key={i} className="text-xs p-3 bg-surface rounded-lg border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold font-mono">{c.case_number || c.caseNumber || "—"}</span>
                      <span className="text-outline">{c.registration_date || c.date || ""}</span>
                    </div>
                    {(c.case_type || c.category) && <p className="text-slate-500">{c.case_type || c.category}</p>}
                    {(c.plaintiff || c.claimant) && <p>Истец: {c.plaintiff || c.claimant}</p>}
                    {(c.defendant || c.respondent) && <p>Ответчик: {c.defendant || c.respondent}</p>}
                    {c.amount && <p className="font-semibold">Сумма: {Number(c.amount).toLocaleString("ru-RU")} ₽</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Лизинговые договоры */}
          {leases.length > 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
              <h3 className="text-lg font-bold mb-4 font-headline">Лизинговые договоры ({leases.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {leases.slice(0, 20).map((l, i) => (
                  <div key={i} className="text-xs p-3 bg-surface rounded-lg border border-slate-100">
                    {l.lessor_name && <p>Лизингодатель: <span className="font-semibold">{l.lessor_name}</span></p>}
                    {l.subject && <p>Предмет: {l.subject}</p>}
                    {l.contract_date && <p className="text-outline">Дата: {l.contract_date}</p>}
                    {l.amount && <p className="font-semibold">Сумма: {Number(l.amount).toLocaleString("ru-RU")} ₽</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Вакансии */}
          {vacancies.length > 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
              <h3 className="text-lg font-bold mb-4 font-headline">Вакансии ({dn.vacancies?.total_vacancies || vacancies.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {vacancies.slice(0, 20).map((v, i) => (
                  <div key={i} className="text-xs p-3 bg-surface rounded-lg border border-slate-100">
                    <p className="font-semibold">{v.vacancy_name || v.name}</p>
                    {v.salary && <p>Зарплата: {v.salary}</p>}
                    {(v.salary_min || v.salary_max) && <p>Зарплата: {v.salary_min || "—"} — {v.salary_max || "—"} ₽</p>}
                    {v.region_name && <p className="text-outline">{v.region_name}</p>}
                    {v.published_date && <p className="text-outline">{new Date(v.published_date).toLocaleDateString("ru-RU")}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Продукция */}
          {products.length > 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
              <h3 className="text-lg font-bold mb-4 font-headline">Продукция / Товарные знаки</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {products.slice(0, 20).map((p, i) => (
                  <div key={i} className="text-xs p-3 bg-surface rounded-lg border border-slate-100">
                    <p className="font-semibold">{p.name || p.title || JSON.stringify(p).slice(0, 200)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-outline">Данные актуальны на {new Date(cd.fetchedAt).toLocaleDateString("ru-RU")} · Источники: Checkko, DataNewton</p>
        </div>
        );
      })()}

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
