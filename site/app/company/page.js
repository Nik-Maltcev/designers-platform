import Link from "next/link";

export const metadata = {
  title: "Профиль компании — ПроектЛист",
  description: "Карточка подрядчика: портфолио, верификация, контакты, услуги.",
};

export default function CompanyPage() {
  return (
    <main className="pt-24 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Header Section */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest font-semibold">
            <Link href="/contractors" className="hover:text-primary transition-colors">Подрядчики</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Elite Engineering Group</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline">Elite Engineering Group</h1>
            <div className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              Проверен
            </div>
          </div>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">Премиальная реализация архитектурных и инженерных проектов для жилых объектов высокого сегмента по всей стране.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="bg-surface-container-high text-on-surface px-5 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-sm">mail</span>
            Открыть контакты
          </button>
          <button className="bg-secondary-container text-on-secondary-container px-5 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm">bookmark</span>
            Сохранить
          </button>
          <button className="hero-gradient text-on-primary px-8 py-3 rounded-md font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity">
            Пригласить к проекту
          </button>
        </div>
      </header>

      {/* Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* About */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            О компании
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>Основана в 2012 году. Elite Engineering Group — ведущая компания в области архитектурного кураторства. Мы специализируемся на реализации премиальных жилых проектов.</p>
            <p>Команда из 45 сертифицированных инженеров и проектных менеджеров. Используем передовые BIM-технологии для каждого проекта.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Основана</span>
              <span className="text-on-surface font-semibold">2012</span>
            </div>
            <div>
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Завершённых проектов</span>
              <span className="text-on-surface font-semibold">120+</span>
            </div>
            <div>
              <span className="block text-xs text-outline uppercase font-bold tracking-wider mb-1">Команда</span>
              <span className="text-on-surface font-semibold">45 специалистов</span>
            </div>
          </div>
        </div>

        {/* Side Cards */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Категории</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">Инженерные конструкции</span>
              <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">Премиум ремонт</span>
              <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">BIM-консалтинг</span>
              <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant shadow-sm">Управление проектами</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Регионы работы</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span className="text-sm font-medium">Москва и МО</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span className="text-sm font-medium">Санкт-Петербург</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span className="text-sm font-medium">Краснодарский край</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Gallery */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight font-headline">Реализованные проекты</h2>
          <button className="text-primary font-bold text-sm hover:underline decoration-2 underline-offset-4">Все портфолио</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group cursor-pointer">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest mb-4 relative">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Вилла" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white font-bold">2023 · Жилой</span>
              </div>
            </div>
            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">Стеклянный павильон</h4>
            <p className="text-sm text-on-surface-variant">Полная реализация конструктива и инженерных систем.</p>
          </div>
          <div className="group cursor-pointer">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest mb-4 relative">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Лофт" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white font-bold">2022 · Коммерческий</span>
              </div>
            </div>
            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">Лофт на Красном Октябре</h4>
            <p className="text-sm text-on-surface-variant">Адаптивное использование и сложный проект усиления.</p>
          </div>
          <div className="group cursor-pointer">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest mb-4 relative">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Культурный центр" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white font-bold">2024 · В процессе</span>
              </div>
            </div>
            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">Культурный центр «Обсидиан»</h4>
            <p className="text-sm text-on-surface-variant">BIM-координация и ведущий инженерный консалтинг.</p>
          </div>
        </div>
      </section>

      {/* Финансы и верификация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="text-xl font-bold mb-6 font-headline">Финансовые данные</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="space-y-1">
                <span className="text-xs text-outline uppercase font-bold tracking-wider">Выручка за 2024 год</span>
                <p className="text-lg font-bold text-on-surface">185 000 000 ₽</p>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="space-y-1">
                <span className="text-xs text-outline uppercase font-bold tracking-wider">Сотрудников</span>
                <p className="text-lg font-bold text-on-surface">45</p>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl">groups</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="space-y-1">
                <span className="text-xs text-outline uppercase font-bold tracking-wider">Сайт компании</span>
                <p className="text-sm font-semibold text-primary">elite-engineering.ru</p>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl">language</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
          <h3 className="text-xl font-bold mb-6 font-headline">Данные верификации</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
              <div className="space-y-1">
                <span className="text-xs text-outline uppercase font-bold">Статус ОГРН</span>
                <p className="text-sm font-mono text-on-surface">1127746592031</p>
              </div>
              <div className="text-teal-600 flex items-center gap-1 text-xs font-bold uppercase">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                Активен
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
              <div className="space-y-1">
                <span className="text-xs text-outline uppercase font-bold">Статус ИНН</span>
                <p className="text-sm font-mono text-on-surface">7701964502</p>
              </div>
              <div className="text-teal-600 flex items-center gap-1 text-xs font-bold uppercase">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                Проверен
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Contractors */}
      <section className="mb-20">
        <h2 className="text-xl font-extrabold tracking-tight mb-8 font-headline">Похожие подрядчики</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Apex Structures", desc: "Сталь и бетон" },
            { name: "Heritage Masonry", desc: "Реставрация и камень" },
            { name: "Vanguard Build", desc: "Жилые объекты" },
            { name: "Nordic Tech Systems", desc: "Инженерные системы" },
          ].map((item) => (
            <Link href="/company" key={item.name} className="p-5 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-md bg-white border border-outline-variant/10"></div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_outward</span>
              </div>
              <p className="font-bold text-sm mb-1">{item.name}</p>
              <p className="text-xs text-on-surface-variant">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <div className="relative hero-gradient rounded-2xl overflow-hidden p-12 text-center text-on-primary">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/40 to-transparent"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight font-headline">Нужен короткий список под проект?</h2>
          <p className="text-primary-fixed-dim text-lg">Наши эксперты вручную подберут топ-5 подрядчиков, идеально подходящих под ваш проект, в течение 24 часов.</p>
          <Link href="/post-project" className="inline-block bg-white text-primary px-8 py-4 rounded-md font-bold text-lg hover:bg-surface transition-colors">Отправить проект на подбор</Link>
        </div>
      </div>
    </main>
  );
}
