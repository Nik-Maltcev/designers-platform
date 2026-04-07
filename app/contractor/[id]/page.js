import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { title: "Подрядчик не найден" };
  return { title: `${user.companyName || user.name} — ПроектЛист` };
}

export default async function ContractorPage({ params }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "contractor") notFound();

  return (
    <main className="pt-24 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      <header className="mb-12">
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-4">
          <Link href="/contractors" className="hover:text-primary transition-colors">Подрядчики</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">{user.companyName || user.name}</span>
        </nav>
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline">{user.companyName || user.name}</h1>
          {user.verified && (
            <div className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Проверен
            </div>
          )}
        </div>
        {user.description && <p className="text-on-surface-variant max-w-2xl">{user.description}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span> О компании
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {user.city && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Город</span><span className="font-semibold">{user.city}</span></div>}
            {user.segment && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Сегмент</span><span className="font-semibold">{user.segment}</span></div>}
            {user.inn && <div><span className="block text-xs text-outline uppercase font-bold mb-1">ИНН</span><span className="font-semibold font-mono">{user.inn}</span></div>}
            {user.website && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Сайт</span><a href={user.website.startsWith("http") ? user.website : "https://" + user.website} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">{user.website}</a></div>}
            {user.minBudget && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Мин. чек</span><span className="font-semibold">{user.minBudget}</span></div>}
            {user.estimateTime && <div><span className="block text-xs text-outline uppercase font-bold mb-1">Срок расчёта</span><span className="font-semibold">{user.estimateTime}</span></div>}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            {user.hasProduction && <span className="flex items-center gap-1 text-sm"><span className="material-symbols-outlined text-primary text-sm">factory</span> Своё производство</span>}
            {user.hasInstallation && <span className="flex items-center gap-1 text-sm"><span className="material-symbols-outlined text-primary text-sm">construction</span> Монтаж</span>}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          {user.categories.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Категории</h3>
              <div className="flex flex-wrap gap-2">{user.categories.map((c) => <span key={c} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">{c}</span>)}</div>
            </div>
          )}
          {user.objectTypes.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Типы объектов</h3>
              <div className="flex flex-wrap gap-2">{user.objectTypes.map((t) => <span key={t} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">{t}</span>)}</div>
            </div>
          )}
          {user.materials.length > 0 && (
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Материалы</h3>
              <div className="flex flex-wrap gap-2">{user.materials.map((m) => <span key={m} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">{m}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
