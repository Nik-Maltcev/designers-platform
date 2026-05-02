import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return { title: "Компания не найдена" };
  return { title: `${company.name} — ПроектЛист`, description: company.description || `Профиль ${company.name}` };
}

export default async function CompanyPage({ params }) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { projects: true, reviewSummary: true },
  });

  if (!company) notFound();

  return (
    <main className="pt-24 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      <header className="mb-12">
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-4">
          <Link href="/contractors" className="hover:text-primary transition-colors">Подрядчики</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">{company.name}</span>
        </nav>
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline">{company.name}</h1>
          {company.verified && (
            <div className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              Проверен
            </div>
          )}
        </div>
        {company.description && <p className="text-on-surface-variant max-w-2xl leading-relaxed">{company.description}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            О компании
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {company.city && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Город</span><span className="text-on-surface font-semibold">{company.city}</span></div>}
            {company.inn && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">ИНН</span><span className="text-on-surface font-semibold font-mono">{company.inn}</span></div>}
            {company.type && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Тип</span><span className="text-on-surface font-semibold">{company.type === "supplier" ? "Поставщик" : "Подрядчик"}</span></div>}
            {company.segment && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Сегмент</span><span className="text-on-surface font-semibold">{company.segment === "premium" ? "Премиум" : company.segment === "medium-plus" ? "Средний+" : "Средний"}</span></div>}
            {company.website && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Сайт</span><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">{company.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a></div>}
            {company.employees && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Сотрудников</span><span className="text-on-surface font-semibold">{company.employees}</span></div>}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          {company.categories.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Категории</h3>
              <div className="flex flex-wrap gap-2">
                {company.categories.map((c) => (<span key={c} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">{c}</span>))}
              </div>
            </div>
          )}
          {company.regions.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Регионы</h3>
              <div className="flex flex-wrap gap-2">
                {company.regions.map((r) => (<span key={r} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">{r}</span>))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === Юридические данные === */}
      {(company.ogrn || company.director || company.registrationDate || company.revenue || company.status) && (
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>apartment</span>
            Юридическая информация
          </h2>
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {company.ogrn && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">ОГРН</span><span className="text-on-surface font-semibold font-mono">{company.ogrn}</span></div>}
              {company.director && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Руководитель</span><span className="text-on-surface font-semibold">{company.director}</span></div>}
              {company.registrationDate && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Дата регистрации</span><span className="text-on-surface font-semibold">{company.registrationDate}</span></div>}
              {company.status && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Статус</span><span className={`font-semibold ${company.status === "Действует" ? "text-green-700" : "text-red-700"}`}>{company.status}</span></div>}
              {company.address && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Юридический адрес</span><span className="text-on-surface font-semibold">{company.address}</span></div>}
              {company.foundedYear && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Год основания</span><span className="text-on-surface font-semibold">{company.foundedYear}</span></div>}
            </div>
          </div>
        </section>
      )}

      {/* === Финансы === */}
      {(company.revenue || company.profit || company.employees) && (
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>payments</span>
            Финансы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {company.revenue && (
              <div className="bg-surface-container-lowest p-6 rounded-xl text-center">
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-2">Выручка</span>
                <span className="text-2xl font-extrabold text-primary">{Number(company.revenue) > 1000000 ? `${(Number(company.revenue) / 1000000).toFixed(1)} млн ₽` : Number(company.revenue) > 1000 ? `${(Number(company.revenue) / 1000).toFixed(0)} тыс ₽` : `${company.revenue} ₽`}</span>
              </div>
            )}
            {company.profit && (
              <div className="bg-surface-container-lowest p-6 rounded-xl text-center">
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-2">Чистая прибыль</span>
                <span className={`text-2xl font-extrabold ${Number(company.profit) >= 0 ? "text-green-700" : "text-red-700"}`}>{Number(company.profit) > 1000000 ? `${(Number(company.profit) / 1000000).toFixed(1)} млн ₽` : Number(company.profit) > 1000 ? `${(Number(company.profit) / 1000).toFixed(0)} тыс ₽` : `${company.profit} ₽`}</span>
              </div>
            )}
            {company.employees && (
              <div className="bg-surface-container-lowest p-6 rounded-xl text-center">
                <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-2">Сотрудников</span>
                <span className="text-2xl font-extrabold text-primary">{company.employees}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === Судебные дела, контракты, исп. производства === */}
      {(company.courtCasesCount > 0 || company.contractsCount > 0 || company.enforcementsCount > 0) && (
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>gavel</span>
            Судебная и контрактная активность
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl text-center">
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-2">Судебные дела</span>
              <span className={`text-2xl font-extrabold ${company.courtCasesCount > 5 ? "text-red-700" : company.courtCasesCount > 0 ? "text-yellow-700" : "text-green-700"}`}>{company.courtCasesCount}</span>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl text-center">
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-2">Госконтракты</span>
              <span className="text-2xl font-extrabold text-primary">{company.contractsCount}</span>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl text-center">
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-2">Исп. производства</span>
              <span className={`text-2xl font-extrabold ${company.enforcementsCount > 0 ? "text-red-700" : "text-green-700"}`}>{company.enforcementsCount}</span>
            </div>
          </div>

          {/* Список судебных дел */}
          {company.courtCases && Array.isArray(company.courtCases) && company.courtCases.length > 0 && (
            <div className="bg-surface-container-lowest p-6 rounded-xl mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Судебные дела (последние)</h3>
              <div className="space-y-3">
                {company.courtCases.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b border-outline-variant/20 pb-3 last:border-0">
                    <span className="material-symbols-outlined text-outline text-base mt-0.5">description</span>
                    <div>
                      <span className="font-semibold">{c.НомерДела || c.case_number || c.number || `Дело #${i + 1}`}</span>
                      {(c.Категория || c.category) && <span className="text-on-surface-variant ml-2">— {c.Категория || c.category}</span>}
                      {(c.Сумма || c.amount) && <span className="text-primary ml-2 font-semibold">{c.Сумма || c.amount} ₽</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Список контрактов */}
          {company.contracts && Array.isArray(company.contracts) && company.contracts.length > 0 && (
            <div className="bg-surface-container-lowest p-6 rounded-xl mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Госконтракты (последние)</h3>
              <div className="space-y-3">
                {company.contracts.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b border-outline-variant/20 pb-3 last:border-0">
                    <span className="material-symbols-outlined text-outline text-base mt-0.5">handshake</span>
                    <div>
                      <span className="font-semibold">{c.Предмет || c.subject || c.title || `Контракт #${i + 1}`}</span>
                      {(c.Цена || c.price || c.amount) && <span className="text-primary ml-2 font-semibold">{(c.Цена || c.price || c.amount).toLocaleString?.()} ₽</span>}
                      {(c.Дата || c.date) && <span className="text-on-surface-variant ml-2 text-xs">{c.Дата || c.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Исполнительные производства */}
          {company.enforcements && Array.isArray(company.enforcements) && company.enforcements.length > 0 && (
            <div className="bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Исполнительные производства</h3>
              <div className="space-y-3">
                {company.enforcements.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b border-outline-variant/20 pb-3 last:border-0">
                    <span className="material-symbols-outlined text-red-600 text-base mt-0.5">warning</span>
                    <div>
                      <span className="font-semibold">{e.Предмет || e.subject || `Производство #${i + 1}`}</span>
                      {(e.Сумма || e.amount) && <span className="text-red-700 ml-2 font-semibold">{e.Сумма || e.amount} ₽</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* === Юридические данные === */}
      {(company.ogrn || company.director || company.registrationDate || company.revenue || company.status) && (
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>apartment</span>
            Юридическая информация
          </h2>
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {company.ogrn && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">ОГРН</span><span className="font-semibold font-mono">{company.ogrn}</span></div>}
              {company.inn && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">ИНН</span><span className="font-semibold font-mono">{company.inn}</span></div>}
              {company.director && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Руководитель</span><span className="font-semibold">{company.director}</span></div>}
              {company.registrationDate && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Дата регистрации</span><span className="font-semibold">{company.registrationDate}</span></div>}
              {company.status && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Статус</span><span className={`font-semibold ${company.status === "Действует" ? "text-green-700" : "text-red-700"}`}>{company.status}</span></div>}
              {company.address && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Юридический адрес</span><span className="font-semibold">{company.address}</span></div>}
              {company.foundedYear && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Год основания</span><span className="font-semibold">{company.foundedYear}</span></div>}
              {company.employees && <div><span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Сотрудников</span><span className="font-semibold">{company.employees}</span></div>}
            </div>
          </div>
        </section>
      )}

      {/* === Финансы и суды === */}
      {(company.revenue || company.profit || company.courtCasesCount > 0 || company.contractsCount > 0 || company.enforcementsCount > 0) && (
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>monitoring</span>
            Финансы и проверки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(company.revenue || company.profit) && (
              <div className="bg-surface-container-lowest p-6 rounded-xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Финансы</h3>
                {company.revenue && <div className="mb-3"><span className="block text-xs text-outline uppercase font-bold mb-1">Выручка</span><span className="text-2xl font-extrabold text-on-surface">{Number(company.revenue).toLocaleString("ru-RU")} ₽</span></div>}
                {company.profit && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Чистая прибыль</span><span className={`text-2xl font-extrabold ${Number(company.profit) >= 0 ? "text-green-700" : "text-red-700"}`}>{Number(company.profit).toLocaleString("ru-RU")} ₽</span></div>}
              </div>
            )}
            <div className="bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Судебные дела</h3>
              <span className={`text-3xl font-extrabold ${company.courtCasesCount > 0 ? "text-yellow-600" : "text-green-700"}`}>{company.courtCasesCount || 0}</span>
              <span className="block text-xs text-outline mt-1">{company.courtCasesCount > 0 ? "Есть судебные дела" : "Судебных дел нет"}</span>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Госконтракты</h3>
                <span className="text-3xl font-extrabold text-on-surface">{company.contractsCount || 0}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Исполнительные производства</h3>
                <span className={`text-3xl font-extrabold ${company.enforcementsCount > 0 ? "text-red-700" : "text-green-700"}`}>{company.enforcementsCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Детали судебных дел */}
          {company.courtCases && Array.isArray(company.courtCases) && company.courtCases.length > 0 && (
            <div className="mt-6 bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Последние судебные дела</h3>
              <div className="space-y-3">
                {company.courtCases.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-yellow-600 text-sm mt-0.5">gavel</span>
                    <div className="text-sm">
                      <span className="font-semibold">{c.НомерДела || c.case_number || `Дело #${i + 1}`}</span>
                      {(c.Категория || c.category) && <span className="text-on-surface-variant ml-2">— {c.Категория || c.category}</span>}
                      {(c.Сумма || c.amount) && <span className="text-on-surface-variant ml-2">({Number(c.Сумма || c.amount).toLocaleString("ru-RU")} ₽)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Детали госконтрактов */}
          {company.contracts && Array.isArray(company.contracts) && company.contracts.length > 0 && (
            <div className="mt-6 bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Последние госконтракты</h3>
              <div className="space-y-3">
                {company.contracts.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">description</span>
                    <div className="text-sm">
                      <span className="font-semibold">{c.Предмет || c.subject || `Контракт #${i + 1}`}</span>
                      {(c.Сумма || c.price) && <span className="text-on-surface-variant ml-2">— {Number(c.Сумма || c.price).toLocaleString("ru-RU")} ₽</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {company.reviewSummary && company.reviewSummary.summary && (
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>reviews</span>
            Отзывы
          </h2>
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              {company.reviewSummary.avgRating && (
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-extrabold text-primary">{company.reviewSummary.avgRating.toFixed(1)}</span>
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                </div>
              )}
              {company.reviewSummary.tone && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${company.reviewSummary.tone === "positive" ? "bg-green-100 text-green-800" : company.reviewSummary.tone === "negative" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {company.reviewSummary.tone === "positive" ? "Положительные" : company.reviewSummary.tone === "negative" ? "Отрицательные" : "Смешанные"}
                </span>
              )}
            </div>
            <p className="text-on-surface-variant leading-relaxed">{company.reviewSummary.summary}</p>
            {company.reviewSummary.sources && Array.isArray(company.reviewSummary.sources) && company.reviewSummary.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {company.reviewSummary.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline bg-primary-fixed/30 px-2 py-1 rounded">
                    {s.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {company.projects.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-8">Проекты ({company.projects.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {company.projects.map((project) => (
              <div key={project.id} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest mb-4 relative">
                  {project.imageUrls[0] ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={project.title} src={project.imageUrls[0]} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline">image</span>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{project.title}</h4>
                {project.description && <p className="text-sm text-on-surface-variant line-clamp-2">{project.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
