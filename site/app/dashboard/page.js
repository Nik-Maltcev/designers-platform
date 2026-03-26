import { auth } from "../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Личный кабинет — ПроектЛист",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
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
          <p className="text-sm text-on-surface-variant">Email: {session.user.email}</p>
          <p className="text-sm text-on-surface-variant">Роль: {session.user.role || "Не указана"}</p>
          <Link href="/profile" className="inline-block text-primary font-bold text-sm hover:underline">
            Заполнить профиль →
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
