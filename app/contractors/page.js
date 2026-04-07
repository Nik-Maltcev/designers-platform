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
    <div className="flex min-h-screen pt-20">
      <main className="flex-1 px-8 pb-12">
        <header className="py-12 max-w-7xl mx-auto">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-6xl font-extrabold tracking-tighter font-headline text-primary">Подрядчики и производства</h1>
            <p className="text-on-surface-variant max-w-md">
              {contractors.length > 0
                ? `${contractors.length} компаний в каталоге`
                : "Каталог пока пуст. Зарегистрируйтесь как подрядчик чтобы появиться здесь."}
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8">
          {contractors.map((c) => (
            <article key={c.id} className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row gap-8 hover:bg-surface-container-low transition-all">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-primary">business</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold font-headline">{c.companyName || c.name}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {c.city && (
                    <span className="flex items-center gap-1 text-xs text-outline">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {c.city}
                    </span>
                  )}
                </div>
                {c.name && c.companyName && (
                  <p className="text-sm text-on-surface-variant mt-2">Контактное лицо: {c.name}</p>
                )}
              </div>
            </article>
          ))}

          {contractors.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">engineering</span>
              <p className="text-on-surface-variant text-lg">Пока нет зарегистрированных подрядчиков</p>
              <Link href="/login" className="inline-block mt-4 hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">
                Зарегистрироваться как подрядчик
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
