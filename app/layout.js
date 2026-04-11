import "./globals.css";
import Link from "next/link";
import { auth } from "./lib/auth";
import AuthButton from "./components/AuthButton";

export const metadata = {
  title: "ПроектЛист — платформа проектных закупок для интерьера",
  description: "Найдите проверенных подрядчиков, дизайнеров и поставщиков для реализации интерьерных проектов. Верификация, кураторский подбор, сравнение предложений.",
};

export default async function RootLayout({ children }) {
  const session = await auth();
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=108495211','ym');ym(108495211,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`,
          }}
        />
        <noscript>
          <div><img src="https://mc.yandex.ru/watch/108495211" style={{ position: "absolute", left: "-9999px" }} alt="" /></div>
        </noscript>
      </head>
      <body className="bg-surface text-on-surface font-body antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
        {/* TopNavBar */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-8 py-4 max-w-full mx-auto">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-primary font-headline">
              ПроектЛист
            </Link>
            <div className="hidden md:flex items-center space-x-8 font-headline text-sm font-semibold tracking-tight">
              <Link href="/contractors" className="text-slate-600 hover:text-primary transition-colors">Подрядчики</Link>
              <Link href="/designers" className="text-slate-600 hover:text-primary transition-colors">Дизайнеры</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-primary transition-colors">Тарифы</Link>
              <AuthButton session={session} />
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/post-project"
                className="hero-gradient text-on-primary px-6 py-2.5 rounded-md font-headline font-bold text-sm tracking-wide transition-all duration-300 hover:opacity-90 active:scale-95"
              >
                Разместить проект
              </Link>
            </div>
          </div>
        </nav>

        {children}

        {/* Footer */}
        <footer className="w-full mt-auto py-12 px-8 bg-slate-50 border-t border-slate-200/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto text-xs text-slate-500 leading-relaxed">
            <div className="space-y-6">
              <div className="text-lg font-bold text-primary font-headline tracking-tighter">ПроектЛист</div>
              <p>© 2025 ПроектЛист. Данные обрабатываются на защищённых серверах в России в соответствии с законодательством.</p>
              <div className="flex space-x-6">
                <Link href="/terms" className="text-slate-500 hover:text-primary transition-colors">Правила пользования сервисом</Link>
                <Link href="/privacy" className="text-slate-500 hover:text-primary transition-colors">Политика конфиденциальности</Link>
                <Link href="/terms" className="text-slate-500 hover:text-primary transition-colors">Оферта</Link>
              </div>
            </div>
            <div className="md:text-right flex flex-col justify-end space-y-4">
              <p className="text-primary font-bold">Связаться с поддержкой</p>
              <div className="flex md:justify-end space-x-4">
                <span className="material-symbols-outlined text-xl cursor-pointer hover:text-primary">alternate_email</span>
                <span className="material-symbols-outlined text-xl cursor-pointer hover:text-primary">chat</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
