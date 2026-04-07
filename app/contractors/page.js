import Link from "next/link";
import { prisma } from "../lib/prisma";
import ContractorFilters from "../components/ContractorFilters";

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
    <div className="flex min-h-screen pt-20">
      <main className="flex-1 px-8 pb-12">
        <header className="py-12 max-w-7xl mx-auto">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-6xl font-extrabold tracking-tighter font-headline text-primary">Подрядчики и производства</h1>
            <p className="text-on-surface-variant max-w-md">
              {contractors.length > 0
                ? `${contractors.length} компаний в каталоге`
                : "Станьте первым подрядчиком в каталоге — зарегистрируйтесь и заполните профиль."}
            </p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto items-start">
          <aside className="w-full lg:w-72 glass-sidebar sticky top-24 p-6 rounded-2xl shadow-sm space-y-8">
            <ContractorFilters />
          </aside>

          <div className="flex-1 grid grid-cols-1 gap-8">
            {contractors.length === 0 && (
              <div className="bg-surface-container-lowest p-12 rounded-xl text-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-4">engineering</span>
                <h3 className="font-headline font-bold text-xl mb-2">Пока нет подрядчиков</h3>
                <p className="text-on-surface-variant mb-6">Зарегистрируйтесь как подрядчик и ваша компания появится здесь</p>
                <Link href="/login" className="hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">Зарегистрироваться</Link>
              </div>
            )}

            {contractors.map((c) => (
              <article key={c.id} className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:translate-y-[-2px] transition-transform duration-300 shadow-sm">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {c.profileFilled && (
                          <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Активен</span>
                        )}
                        {c.city && (
                          <span className="flex items-center gap-1 text-xs text-outline">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {c.city}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-extrabold font-headline leading-tight">{c.companyName || c.name || "Компания"}</h2>
                      {c.name && c.companyName && (
                        <p className="text-sm text-on-surface-variant mt-1">Контактное лицо: {c.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Link href={`/dashboard`} className="py-3 px-6 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all hover:opacity-90 text-center">Открыть профиль</Link>
                    <button className="py-3 px-6 bg-secondary-container text-on-secondary-container font-bold rounded-lg text-sm hover:bg-secondary-fixed transition-colors">Пригласить</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
