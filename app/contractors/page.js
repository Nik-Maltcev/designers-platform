import Link from "next/link";
import { prisma } from "../lib/prisma";

export const metadata = {
  title: "Подрядчики и производства — ПроектЛист",
  description: "Каталог проверенных подрядчиков и производств.",
};

export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  const contractors = await prisma.user.findMany({
    where: { role: "contractor", profileFilled: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-24 pb-12">
      <main className="flex-1 px-8 lg:px-12 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tighter font-headline text-primary mb-4">Подрядчики и производства</h1>
          <p className="text-on-surface-variant max-w-2xl">
            {contractors.length > 0 ? `${contractors.length} компаний в каталоге` : "Каталог пока пуст. Зарегистрируйтесь как подрядчик."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {contractors.map((c) => (
            <article key={c.id} className="bg-surface-container-lowest rounded-xl p-8 hover:bg-surface-container-low transition-all">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
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
                    {c.city && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Регион</p>
                        <p className="text-sm font-semibold">{c.city}</p>
                      </div>
                    )}
                    {c.segment && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p>
                        <p className="text-sm font-semibold">{c.segment}</p>
                      </div>
                    )}
                    {(c.hasProduction || c.hasInstallation) && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Возможности</p>
                        <p className="text-sm font-semibold">
                          {[c.hasProduction && "Производство", c.hasInstallation && "Монтаж"].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                    {c.minBudget && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Мин. чек</p>
                        <p className="text-sm font-semibold">{c.minBudget}</p>
                      </div>
                    )}
                  </div>
                  {c.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {c.categories.map((cat) => (
                        <span key={cat} className="bg-surface-container px-2.5 py-1 rounded-full text-xs font-medium">{cat}</span>
                      ))}
                    </div>
                  )}
                  {c.objectTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {c.objectTypes.map((t) => (
                        <span key={t} className="bg-primary-fixed/20 text-primary px-2.5 py-1 rounded-full text-xs font-medium">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}

          {contractors.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">engineering</span>
              <p className="text-on-surface-variant text-lg mb-4">Пока нет зарегистрированных подрядчиков</p>
              <Link href="/login" className="inline-block hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">
                Зарегистрироваться как подрядчик
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
