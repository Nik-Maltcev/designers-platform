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
    include: { projects: true },
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

      {studio.projects.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline mb-8">Проекты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studio.projects.map((project) => (
              <div key={project.id} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest mb-4 relative">
                  {project.imageUrls[0] ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={project.title} src={project.imageUrls[0]} />
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
