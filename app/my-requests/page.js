import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Мои запросы — ПроектЛист" };
export const dynamic = "force-dynamic";

const statusLabels = {
  new: "Новый",
  in_progress: "В работе",
  completed: "Подрядчики подобраны",
  closed: "Закрыт",
};

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const requests = await prisma.projectRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">Мои запросы</h1>
        <p className="text-on-surface-variant">История ваших запросов на подбор подрядчиков</p>
      </header>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">folder_open</span>
          <p className="text-on-surface-variant text-lg mb-4">У вас пока нет запросов</p>
          <Link href="/post-project" className="inline-block hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">Разместить проект</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{r.category}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === "new" ? "bg-secondary-fixed text-on-secondary-fixed" : r.status === "completed" ? "bg-primary-fixed text-on-primary-fixed-variant" : "bg-surface-container text-on-surface-variant"}`}>
                    {statusLabels[r.status] || r.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                  {r.objectType && <span>{r.objectType}</span>}
                  {r.location && <span>{r.location}</span>}
                  {r.level && <span>{r.level}</span>}
                  <span>{new Date(r.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
