import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Личный кабинет — ПроектЛист" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [requestCount, notifCount, favCount] = await Promise.all([
    prisma.projectRequest.count({ where: { userId: session.user.id } }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    prisma.favorite.count({ where: { userId: session.user.id } }),
  ]);

  const showProfileBanner = !session.user.profileFilled;

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      {showProfileBanner && (
        <div className="mb-8 p-6 bg-primary-fixed/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
            <div>
              <p className="font-bold text-primary">Заполните профиль</p>
              <p className="text-sm text-on-surface-variant">Укажите имя, роль и компанию</p>
            </div>
          </div>
          <Link href="/profile" className="hero-gradient text-on-primary px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap">Заполнить</Link>
        </div>
      )}

      <header className="mb-12">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">Личный кабинет</h1>
        <p className="text-on-surface-variant">Добро пожаловать, {session.user.name || session.user.email}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/profile" className="bg-surface-container-lowest p-6 rounded-xl space-y-3 hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-3xl text-primary">person</span>
          <h3 className="font-headline font-bold text-lg">Профиль</h3>
          <p className="text-sm text-on-surface-variant">
            {session.user.role === "designer" ? "Дизайнер" : session.user.role === "contractor" ? "Подрядчик" : session.user.role || "Не указана"}
            {session.user.companyName ? ` · ${session.user.companyName}` : ""}
          </p>
        </Link>

        <Link href="/my-requests" className="bg-surface-container-lowest p-6 rounded-xl space-y-3 hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-3xl text-primary">folder_open</span>
          <h3 className="font-headline font-bold text-lg">Мои запросы</h3>
          <p className="text-sm text-on-surface-variant">{requestCount > 0 ? `${requestCount} запросов` : "Нет запросов"}</p>
        </Link>

        <Link href="/post-project" className="bg-surface-container-lowest p-6 rounded-xl space-y-3 hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-3xl text-primary">add_circle</span>
          <h3 className="font-headline font-bold text-lg">Новый проект</h3>
          <p className="text-sm text-on-surface-variant">Отправить на подбор подрядчиков</p>
        </Link>

        <Link href="/claim-card" className="bg-surface-container-lowest p-6 rounded-xl space-y-3 hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-3xl text-primary">badge</span>
          <h3 className="font-headline font-bold text-lg">Забрать карточку</h3>
          <p className="text-sm text-on-surface-variant">Подтвердите компанию</p>
        </Link>

        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-3">
          <span className="material-symbols-outlined text-3xl text-primary">notifications</span>
          <h3 className="font-headline font-bold text-lg">Уведомления</h3>
          <p className="text-sm text-on-surface-variant">{notifCount > 0 ? `${notifCount} непрочитанных` : "Нет новых"}</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-3">
          <span className="material-symbols-outlined text-3xl text-primary">bookmark</span>
          <h3 className="font-headline font-bold text-lg">Избранное</h3>
          <p className="text-sm text-on-surface-variant">{favCount > 0 ? `${favCount} сохранённых` : "Пусто"}</p>
        </div>
      </div>
    </main>
  );
}
