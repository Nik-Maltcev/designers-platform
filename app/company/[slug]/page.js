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
    include: { projects: true },
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
