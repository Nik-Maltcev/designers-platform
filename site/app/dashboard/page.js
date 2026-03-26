import { auth } from "../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Личный кабинет — ПроектЛист",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const showProfileBanner = !session.user.profileFilled;

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      {showProfileBanner && (
        <div className="mb-8 p-6 bg-primary-fixed/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
            <div>
              <p className="font-bold text-primary">Заполните профиль</p>
              <p className="text-sm text-on-surface-variant">Укажите имя, роль и компанию, чтобы получать персональные подборки</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="hero-gradient text-on-primary px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap"
          >
            Заполнить
          </Link>
        </div>
      )}

      <header className="mb-12">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">
          Личный кабинет
        </h1>
        <p className="text-on-surface-variant">
          Добро пожаловать, {session.user.name || session.user.email}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest p-8 rounded-xl space-y-4">
          <span className="material-symbols-outlined text-3xl text-primary">person</span>
          <h3 className="font-headline font-bold text-xl">Профиль</h3>
          <div className="space-y-2 text-sm text-on-surface-variant">
            <p>Email: {session.user.email}</p>
            <p>Роль: {session.user.role === "designer" ? "Дизайнер" :
                      session.user.role === "architect" ? "Архитектор" :
                      session.user.role === "completer" ? "Комплектатор" :
                      session.user.role === "contractor" ? "Подрядчик" :
                      session.user.role === "supplier" ? "Поставщик" :
                      "Не указана"}</p>
            {session.user.companyName && <p>Компания: {session.user.companyName}</p>}
            {session.user.city && <p>Город: {session.user.city}</p>}
          </div>
          <Link href="/profile" className="inline-block text-primary font-bold text-sm hover:underline">
            Редактировать профиль →
          </Link>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl space-y-4">
          <span className="material-symbols-outlined text-3xl text-primary">folder_open</span>
          <h3 className="font-headline font-bold text-xl">Мои проекты</h3>
          <p className="text-sm text-on-surface-variant">У вас пока нет проектов</p>
          <Link href="/post-project" className="inline-block text-primary font-bold text-sm hover:underline">
            Создать проект →
          </Link>
        </div>
      </div>
    </main>
  );
}
