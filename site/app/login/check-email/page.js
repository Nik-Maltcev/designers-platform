import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary">mail</span>
        </div>
        <div className="space-y-3">
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight">
            Проверьте почту
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Мы отправили ссылку для входа на ваш email. Перейдите по ней, чтобы войти в аккаунт.
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl space-y-3">
          <p className="text-sm text-on-surface-variant">Не получили письмо?</p>
          <ul className="text-sm text-on-surface-variant space-y-1">
            <li>• Проверьте папку «Спам»</li>
            <li>• Убедитесь, что email введён верно</li>
          </ul>
          <Link href="/login" className="inline-block text-primary font-bold text-sm mt-2 hover:underline">
            Попробовать снова
          </Link>
        </div>
      </div>
    </main>
  );
}
