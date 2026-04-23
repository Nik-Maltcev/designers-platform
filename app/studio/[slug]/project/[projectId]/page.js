import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug, projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { studio: true } });
  if (!project) return { title: "Проект не найден" };
  return {
    title: `${project.title} — ${project.studio?.name || "Студия"} — ПроектЛист`,
    description: project.description || `Проект ${project.title}`,
  };
}

export default async function ProjectPage({ params }) {
  const { slug, projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { studio: true },
  });

  if (!project || project.studio?.slug !== slug) notFound();

  return (
    <main className="pt-24 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-8">
        <Link href="/designers" className="hover:text-primary transition-colors">Дизайнеры</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href={`/studio/${slug}`} className="hover:text-primary transition-colors">{project.studio?.name}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary">{project.title}</span>
      </nav>

      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-primary font-headline mb-4">{project.title}</h1>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          {project.year && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_month</span>{project.year}</span>}
          {project.objectType && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">apartment</span>{project.objectType}</span>}
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">photo_library</span>{project.imageUrls.length} фото</span>
        </div>
      </header>

      {project.description && (
        <p className="text-on-surface-variant leading-relaxed mb-12 max-w-3xl">{project.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {project.imageUrls.map((url, i) => (
          <div key={i} className={`rounded-xl overflow-hidden bg-surface-container-highest ${i === 0 ? "md:col-span-2" : ""}`}>
            <img
              className="w-full h-auto object-cover"
              alt={`${project.title} — фото ${i + 1}`}
              src={url}
              referrerPolicy="no-referrer"
              loading={i > 2 ? "lazy" : "eager"}
            />
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link href={`/studio/${slug}`} className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Все проекты {project.studio?.name}
        </Link>
      </div>
    </main>
  );
}
