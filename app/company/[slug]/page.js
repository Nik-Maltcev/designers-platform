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
  // @ts-ignore — rawCheckko/rawDataNewton are Json fields

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

      {/* === Данные Checkko + DataNewton === */}
      {(company.rawCheckko || company.rawDataNewton) && (() => {
        const ck = company.rawCheckko || {};
        const dn = company.rawDataNewton || {};
        const ckCompany = ck.company || {};
        const dnCompany = dn.company || {};
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
        const enfArr = Array.isArray(company.enforcements) ? company.enforcements : [];
        const courtArr = Array.isArray(company.courtCases) ? company.courtCases : [];
        const contractsArr = Array.isArray(company.contracts) ? company.contracts : [];

        return (
        <div className="space-y-8 mb-16">
          {/* Основная информация */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
            <h3 className="text-xl font-bold mb-6 font-headline">Информация о компании</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(company.director || ckCompany.Руководитель?.ФИО) && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Руководитель / ФИО ИП</span><span className="text-sm font-semibold">{company.director || ckCompany.Руководитель?.ФИО}</span></div>}
              {(dnCompany.name || ckCompany.НаимСокр) && !(company.director || ckCompany.Руководитель?.ФИО) && <div><span className="block text-xs text-outline uppercase font-bold mb-1">ФИО / Название</span><span className="text-sm font-semibold">{dnCompany.name || ckCompany.НаимСокр}</span></div>}
              {company.ogrn && <div><span className="block text-xs text-outline uppercase font-bold mb-1">ОГРН</span><span className="text-sm font-semibold font-mono">{company.ogrn}</span></div>}
              {company.inn && <div><span className="block text-xs text-outline uppercase font-bold mb-1">ИНН</span><span className="text-sm font-semibold font-mono">{company.inn}</span></div>}
              {company.status && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Статус</span><span className={`text-sm font-semibold ${company.status === "Действует" || dnCompany.active ? "text-teal-600" : "text-red-600"}`}>{company.status}</span></div>}
              {(company.registrationDate || dnCompany.registration_date || ckCompany.ДатаРег) && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Дата регистрации</span><span className="text-sm font-semibold">{company.registrationDate || dnCompany.registration_date || ckCompany.ДатаРег}</span></div>}
              {company.address && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold mb-1">Адрес</span><span className="text-sm font-semibold">{company.address}</span></div>}
              {(dnCompany.activity_kind_dsc || ckCompany.ОКВЭД) && <div className="col-span-2"><span className="block text-xs text-outline uppercase font-bold mb-1">Вид деятельности (ОКВЭД)</span><span className="text-sm font-semibold">{dnCompany.activity_kind_dsc || ckCompany.ОКВЭД} {dnCompany.activity_kind ? `(${dnCompany.activity_kind})` : ""}</span></div>}
              {company.employees && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Сотрудников</span><span className="text-sm font-semibold">{company.employees}</span></div>}
              {(dnCompany.type || ckCompany.ОПФ) && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Тип</span><span className="text-sm font-semibold">{dnCompany.type === "ip" ? "ИП" : dnCompany.type === "ul" ? "ЮЛ" : ckCompany.ОПФ || dnCompany.type}</span></div>}
            </div>
          </div>

          {/* Финансы + Проверка контрагента */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Финансы */}
            <div className="bg-surface-container-low p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-6 font-headline">Финансовые данные</h3>
              <div className="space-y-3">
                {company.revenue && <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm"><div><span className="text-xs text-outline uppercase font-bold">Выручка</span><p className="text-lg font-bold">{Number(company.revenue).toLocaleString("ru-RU")} ₽</p></div><span className="material-symbols-outlined text-primary text-xl">trending_up</span></div>}
                {company.profit && <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm"><div><span className="text-xs text-outline uppercase font-bold">Чистая прибыль</span><p className="text-lg font-bold">{Number(company.profit).toLocaleString("ru-RU")} ₽</p></div><span className="material-symbols-outlined text-primary text-xl">account_balance</span></div>}
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
                  <div><span className="text-xs text-outline uppercase font-bold">Судебные дела</span><p className="text-sm font-semibold">{company.courtCasesCount || 0} дел</p></div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${(company.courtCasesCount || 0) === 0 ? "text-teal-600" : "text-amber-600"}`}>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{(company.courtCasesCount || 0) === 0 ? "check_circle" : "warning"}</span>
                    {(company.courtCasesCount || 0) === 0 ? "Нет" : "Есть"}
                  </div>
                </div>
                <div className="flex justify-between p-3 bg-surface rounded-lg">
                  <div><span className="text-xs text-outline uppercase font-bold">Госконтракты</span><p className="text-sm font-semibold">{company.contractsCount || 0} контрактов</p></div>
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                </div>
                <div className="flex justify-between p-3 bg-surface rounded-lg">
                  <div><span className="text-xs text-outline uppercase font-bold">Исполнительные производства</span><p className="text-sm font-semibold">{company.enforcementsCount || 0} производств</p></div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${(company.enforcementsCount || 0) === 0 ? "text-teal-600" : "text-red-600"}`}>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{(company.enforcementsCount || 0) === 0 ? "check_circle" : "error"}</span>
                    {(company.enforcementsCount || 0) === 0 ? "Нет" : "Есть"}
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
                      <a href={c.kad_arbitr_link || "#"} target="_blank" rel="noopener noreferrer" className="font-bold font-mono text-primary hover:underline">{c.id || c.first_number || "—"}</a>
                      <span className="text-outline">{c.date_start || ""}</span>
                    </div>
                    {c.plaintiffs?.[0] && <p>Истец: <span className="font-semibold">{c.plaintiffs[0].name}</span></p>}
                    {c.respondents?.[0] && <p>Ответчик: <span className="font-semibold">{c.respondents[0].name}</span></p>}
                    {c.sum && <p className="font-semibold mt-1">Сумма: {Number(c.sum).toLocaleString("ru-RU")} ₽</p>}
                    {c.instances?.[0] && <p className="text-outline">{c.instances[0]}</p>}
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
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">Договор №{l.contractNumber || "—"}</span>
                      <span className="text-outline">{l.contractDate || l.startDate || ""}</span>
                    </div>
                    {l.lessor?.data?.fullName && <p>Лизингодатель: <span className="font-semibold">{l.lessor.data.fullName}</span></p>}
                    {l.lessee?.data?.fullName && <p>Лизингополучатель: <span className="font-semibold">{l.lessee.data.fullName}</span></p>}
                    {l.subjects?.[0]?.description && <p>Предмет: {l.subjects[0].description}</p>}
                    {l.stopReason && <p className="text-outline">Статус: {l.stopReason.trim()}</p>}
                    {l.startDate && l.endDate && <p className="text-outline">Период: {l.startDate} — {l.endDate}</p>}
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

          <p className="text-[10px] text-outline">Данные актуальны на {company.enrichedAt ? new Date(company.enrichedAt).toLocaleDateString("ru-RU") : "—"} · Источники: Checkko, DataNewton</p>
        </div>
        );
      })()}

      {company.reviewSummary && (company.reviewSummary.summary || (Array.isArray(company.reviewSummary.sources) && company.reviewSummary.sources.length > 0)) && (
        <div className="bg-surface-container-lowest p-8 rounded-xl mb-16 border border-outline-variant/15">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">reviews</span>
              Отзывы
            </h3>
            {company.reviewSummary.avgRating && (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-on-surface">{company.reviewSummary.avgRating.toFixed(1)}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1", color: star <= Math.round(company.reviewSummary.avgRating) ? "#f59e0b" : "#d1d5db" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-outline">{company.reviewSummary.totalReviews} отзывов</p>
                </div>
              </div>
            )}
          </div>

          {company.reviewSummary.summary && (
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{company.reviewSummary.summary}</p>
          )}

          {(company.reviewSummary.positives?.length > 0 || company.reviewSummary.negatives?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {company.reviewSummary.positives?.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-bold text-teal-600 tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                    Плюсы
                  </p>
                  <ul className="space-y-1.5">
                    {company.reviewSummary.positives.map((p, i) => (
                      <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {company.reviewSummary.negatives?.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-bold text-amber-600 tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
                    Минусы
                  </p>
                  <ul className="space-y-1.5">
                    {company.reviewSummary.negatives.map((n, i) => (
                      <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">−</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {Array.isArray(company.reviewSummary.sources) && company.reviewSummary.sources.length > 0 && (
            <>
              <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-3">Площадки с отзывами</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {company.reviewSummary.sources.map((source, i) => (
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

          {Array.isArray(company.reviewSummary.reviews) && company.reviewSummary.reviews.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4">Тексты отзывов</h4>
              <div className="space-y-3">
                {company.reviewSummary.reviews.map((review, i) => (
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

          <p className="text-[10px] text-outline mt-4">Данные собраны {company.reviewSummary.fetchedAt ? new Date(company.reviewSummary.fetchedAt).toLocaleDateString("ru-RU") : "—"} из открытых источников</p>
        </div>
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
