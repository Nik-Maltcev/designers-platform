import Link from "next/link";

export default function Home() {
  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[921px] flex items-center px-8 md:px-20 py-24 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-7xl mx-auto z-10">
          <div className="lg:col-span-7">
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-primary leading-[1.1] mb-8 tracking-tighter">
              Найдите подрядчиков, дизайнеров и поставщиков для вашего проекта
            </h1>
            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                href="/contractors"
                className="hero-gradient text-on-primary px-8 py-4 rounded-md font-headline font-bold text-lg shadow-lg hover:translate-y-[-2px] transition-all"
              >
                Забрать карточку компании
              </Link>
              <Link
                href="/designers"
                className="bg-surface-container-low text-primary px-8 py-4 rounded-md font-headline font-bold text-lg hover:bg-surface-container-high transition-all"
              >
                Посмотреть дизайнеров
              </Link>
            </div>
            <Link
              href="/post-project"
              className="group flex items-center space-x-2 text-primary font-bold border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
            >
              <span>Отправить проект на подбор</span>
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] bg-surface-container-low rounded-lg overflow-hidden relative">
              <img
                alt="Премиальный интерьер"
                className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg"></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 shadow-xl rounded-lg max-w-[200px] border-l-4 border-primary">
              <p className="font-headline text-3xl font-black text-primary italic">01.</p>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-2">Кураторский подбор</p>
            </div>
          </div>
        </div>
        {/* Structural Decorative Element */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-surface-container-low -z-10 translate-x-1/4 skew-x-[-12deg]"></div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 px-8 md:px-20 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-surface-container-lowest rounded-lg group hover:bg-primary transition-all duration-500">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:text-on-primary transition-colors mb-6">verified_user</span>
              <h3 className="font-headline text-2xl font-bold text-primary group-hover:text-on-primary mb-4">Проверяем компании</h3>
              <p className="text-secondary group-hover:text-on-primary/80 leading-relaxed">Многоуровневая верификация каждого участника платформы для безопасности ваших сделок.</p>
            </div>
            <div className="p-10 bg-surface-container-lowest rounded-lg group hover:bg-primary transition-all duration-500">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:text-on-primary transition-colors mb-6">privacy_tip</span>
              <h3 className="font-headline text-2xl font-bold text-primary group-hover:text-on-primary mb-4">Приватность данных</h3>
              <p className="text-secondary group-hover:text-on-primary/80 leading-relaxed">Не публикуем личные контакты без согласия. Ваш комфорт — наш архитектурный стандарт.</p>
            </div>
            <div className="p-10 bg-surface-container-lowest rounded-lg group hover:bg-primary transition-all duration-500">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:text-on-primary transition-colors mb-6">engineering</span>
              <h3 className="font-headline text-2xl font-bold text-primary group-hover:text-on-primary mb-4">Умный подбор</h3>
              <p className="text-secondary group-hover:text-on-primary/80 leading-relaxed">Подбираем подрядчиков под проект, учитывая специфику, бюджет и географию реализации.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Content Sections */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 md:px-20">
          {/* For Contractors */}
          <div className="flex flex-col lg:flex-row gap-20 items-center mb-40">
            <div className="flex-1 space-y-8 order-2 lg:order-1">
              <span className="inline-block px-4 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase tracking-widest">Для компаний</span>
              <h2 className="font-headline text-5xl font-extrabold text-primary leading-tight">Получайте внимание дизайнеров</h2>
              <p className="text-lg text-secondary leading-relaxed max-w-md">
                Станьте частью эксклюзивного каталога проверенных поставщиков и подрядчиков. Мы соединяем лучшие архитектурные бюро с надежными исполнителями.
              </p>
              <div className="pt-4">
                <Link href="/contractors" className="bg-primary text-on-primary px-8 py-3 rounded-md font-headline font-bold">Разместить профиль</Link>
              </div>
            </div>
            <div className="flex-1 order-1 lg:order-2">
              <div className="relative">
                <img
                  alt="Рабочее пространство"
                  className="rounded-lg shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da"
                />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed-dim/20 -z-10 rounded-full"></div>
              </div>
            </div>
          </div>
          {/* For Designers */}
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1">
              <div className="relative">
                <img
                  alt="Дизайн-студия"
                  className="rounded-lg shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da"
                />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 -z-10 rounded-full"></div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <span className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold uppercase tracking-widest">Для дизайнеров</span>
              <h2 className="font-headline text-5xl font-extrabold text-primary leading-tight">Получите 3-5 подрядчиков под проект</h2>
              <p className="text-lg text-secondary leading-relaxed max-w-md">
                Забудьте о бесконечном поиске. Мы проанализируем ваш запрос и предложим только тех исполнителей, которые точно справятся с вашей задачей.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center space-x-3 text-primary font-semibold">
                  <span className="material-symbols-outlined text-teal-600">done_all</span>
                  <span>Экономия времени до 15 часов на проект</span>
                </li>
                <li className="flex items-center space-x-3 text-primary font-semibold">
                  <span className="material-symbols-outlined text-teal-600">done_all</span>
                  <span>Только проверенные портфолио</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-8 md:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <p className="font-headline text-5xl font-black text-primary">1.2k+</p>
              <p className="text-xs uppercase tracking-widest text-secondary mt-2 font-bold">Верифицированных дизайнеров</p>
            </div>
            <div>
              <p className="font-headline text-5xl font-black text-primary">450</p>
              <p className="text-xs uppercase tracking-widest text-secondary mt-2 font-bold">Премиум подрядчиков</p>
            </div>
            <div>
              <p className="font-headline text-5xl font-black text-primary">8.5k</p>
              <p className="text-xs uppercase tracking-widest text-secondary mt-2 font-bold">Завершённых проектов</p>
            </div>
            <div>
              <p className="font-headline text-5xl font-black text-primary">98%</p>
              <p className="text-xs uppercase tracking-widest text-secondary mt-2 font-bold">Рейтинг доверия</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Canvas */}
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto hero-gradient rounded-xl p-16 md:p-24 text-center text-on-primary relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-headline text-4xl md:text-6xl font-extrabold mb-8 tracking-tighter">Готовы масштабировать ваш бизнес?</h2>
            <p className="text-on-primary/80 text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Присоединяйтесь к сообществу профессионалов, где качество ценится выше количества.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/post-project" className="bg-white text-primary px-10 py-4 rounded-md font-headline font-bold text-lg hover:bg-surface-container-low transition-all">Создать аккаунт</Link>
              <Link href="/pricing" className="border-2 border-white/30 text-white px-10 py-4 rounded-md font-headline font-bold text-lg hover:bg-white/10 transition-all">Узнать больше</Link>
            </div>
          </div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed-dim/20 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-surface-tint/20 blur-[100px] rounded-full"></div>
        </div>
      </section>
    </main>
  );
}
