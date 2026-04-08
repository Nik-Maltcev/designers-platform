import Link from "next/link";

export const metadata = { title: "Оплата успешна — ПроектЛист" };

export default function PaymentSuccessPage() {
  return (
    <main className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-primary">Оплата прошла успешно</h1>
        <p className="text-on-surface-variant">Тариф Профи активирован на 1 год. Все расширенные возможности уже доступны.</p>
        <Link href="/dashboard" className="inline-block hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">В личный кабинет</Link>
      </div>
    </main>
  );
}
