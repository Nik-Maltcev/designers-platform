import Link from "next/link";

export const metadata = {
  title: "Дизайнеры и архитекторы — ПроектЛист",
  description: "Каталог верифицированных дизайнеров, архитекторов и комплектаторов. Фильтры по типу объекта, географии, сегменту.",
};

export default function DesignersPage() {
  return (
    <div className="pt-24 pb-12 flex">
      {/* Sidebar Filter */}
      <aside className="h-[calc(100vh-6rem)] w-72 fixed left-0 top-24 overflow-y-auto px-8 py-6 hidden lg:block">
        <div className="space-y-10">
          {/* Filter: Object Types */}
          <section>
            <h3 className="font-headline text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-6">Тип объекта</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Квартиры</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" defaultChecked />
                <span className="text-sm font-bold text-primary group-hover:text-primary transition-colors">Дома</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Офисы</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Отели</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Рестораны / Кафе</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Клиники</span>
              </label>
            </div>
          </section>

          {/* Filter: Geography */}
          <section>
            <h3 className="font-headline text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-6">География</h3>
            <div className="flex flex-col gap-3">
              <button className="text-left text-sm font-bold text-primary px-3 py-2 bg-secondary-container rounded-lg">Москва</button>
              <button className="text-left text-sm text-secondary px-3 py-2 hover:bg-surface-container-high rounded-lg transition-colors">МО</button>
              <button className="text-left text-sm text-secondary px-3 py-2 hover:bg-surface-container-high rounded-lg transition-colors">СПб</button>
              <button className="text-left text-sm text-secondary px-3 py-2 hover:bg-surface-container-high rounded-lg transition-colors">Вся Россия</button>
            </div>
          </section>

          {/* Filter: Segment */}
          <section>
            <h3 className="font-headline text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-6">Сегмент</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="border border-outline-variant text-xs py-2 px-3 rounded-md hover:border-primary hover:text-primary transition-all">Средний</button>
              <button className="border border-outline-variant text-xs py-2 px-3 rounded-md hover:border-primary hover:text-primary transition-all">Средний+</button>
              <button className="border-2 border-primary bg-primary/5 text-xs py-2 px-3 rounded-md font-bold text-primary">Премиум</button>
            </div>
          </section>

          {/* Filter: Services */}
          <section>
            <h3 className="font-headline text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-6">Услуги</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" defaultChecked />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Дизайн-проект</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Комплектация</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Авторский надзор</span>
              </label>
              <label className="flex items-center group cursor-pointer">
                <input className="rounded-sm border-outline-variant text-primary focus:ring-primary/20 mr-3" type="checkbox" />
                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">Рабочая документация</span>
              </label>
            </div>
          </section>

          {/* Filter: Activity */}
          <section>
            <h3 className="font-headline text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-6">Активность</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Активный профиль</span>
                <div className="w-8 h-4 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Публикации (12 мес)</span>
                <div className="w-8 h-4 bg-outline-variant rounded-full relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 flex-1 px-8 lg:px-12">
        <header className="mb-12">
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface mb-4">
            Дизайнеры, архитекторы и комплектаторы
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Профессиональное сообщество верифицированных экспертов. Используйте расширенные фильтры для подбора партнера по архитектурным и интерьерным задачам любого масштаба.
          </p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 gap-10">
          {/* Card 1 */}
          <article className="bg-surface-container-lowest p-8 rounded-none flex flex-col md:flex-row gap-8 hover:bg-surface-container-low transition-all duration-500 relative group overflow-hidden">
            <div className="w-full md:w-56 h-64 flex-shrink-0 overflow-hidden rounded-lg">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Интерьер проект" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-primary mb-1">Studia 54</h2>
                  <div className="flex gap-2">
                    <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Проверен</span>
                    <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Активен</span>
                  </div>
                </div>
                <button className="text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-xl">bookmark_add</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Тип объекта</p>
                  <p className="text-sm font-semibold text-on-surface">Дома, Пентхаусы</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p>
                  <p className="text-sm font-semibold text-on-surface">Премиум</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Проекты</p>
                  <p className="text-sm font-semibold text-on-surface">142 кейса</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Публикации</p>
                  <p className="text-sm font-semibold text-on-surface">AD, Elle Decor</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button className="hero-gradient text-on-primary text-xs font-bold px-4 py-2.5 rounded-md hover:opacity-90">Открыть контакты</button>
                <Link href="/company" className="bg-surface-container-high text-primary text-xs font-bold px-4 py-2.5 rounded-md hover:bg-surface-container-highest transition-colors">Открыть профиль</Link>
              </div>
            </div>
          </article>

          {/* Card 2 */}
          <article className="bg-surface-container-lowest p-8 rounded-none flex flex-col md:flex-row gap-8 hover:bg-surface-container-low transition-all duration-500 relative group overflow-hidden">
            <div className="w-full md:w-56 h-64 flex-shrink-0 overflow-hidden rounded-lg">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Спальня интерьер" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-primary mb-1">Bureau SLAVA</h2>
                  <div className="flex gap-2">
                    <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Проверен</span>
                  </div>
                </div>
                <button className="text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 1"}}>bookmark</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Тип объекта</p>
                  <p className="text-sm font-semibold text-on-surface">Офисы, HoReCa</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p>
                  <p className="text-sm font-semibold text-on-surface">Средний+</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Проекты</p>
                  <p className="text-sm font-semibold text-on-surface">68 кейсов</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Публикации</p>
                  <p className="text-sm font-semibold text-on-surface">Architectural Digest</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button className="hero-gradient text-on-primary text-xs font-bold px-4 py-2.5 rounded-md hover:opacity-90">Открыть контакты</button>
                <Link href="/company" className="bg-surface-container-high text-primary text-xs font-bold px-4 py-2.5 rounded-md hover:bg-surface-container-highest transition-colors">Открыть профиль</Link>
              </div>
            </div>
          </article>

          {/* Card 3 */}
          <article className="bg-surface-container-lowest p-8 rounded-none flex flex-col md:flex-row gap-8 hover:bg-surface-container-low transition-all duration-500 relative group overflow-hidden">
            <div className="w-full md:w-56 h-64 flex-shrink-0 overflow-hidden rounded-lg">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Архитектура экстерьер" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfao_fY1BqBgnI1m8NpD94xwQdOpQeIWH7PUEJaUzEHkuawWReQRvkGmeZg-pv2EAeUFDCb4gv0_Q_iqHpOEG5RF0tHYyBCemLzY5tDKAQ444s4UgEPOsOQPwKV9umVPcrPxGp-S7r7FiZmDygQaunBilFjC1UoUoIWqCXS_vRl0Dxffr_xEg0jH2zYTOd75AjBOY2S6FBrkXw8hlSWyAtlc47x78jKZJNtcLLkJdl4NjcBs4dx95aXQUm647g4jVZpufW-A0SCSgV" />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-primary mb-1">Alexander Design</h2>
                  <div className="flex gap-2">
                    <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Активен</span>
                  </div>
                </div>
                <button className="text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-xl">bookmark_add</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Тип объекта</p>
                  <p className="text-sm font-semibold text-on-surface">Частные дома</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p>
                  <p className="text-sm font-semibold text-on-surface">Премиум</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Проекты</p>
                  <p className="text-sm font-semibold text-on-surface">32 кейса</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Публикации</p>
                  <p className="text-sm font-semibold text-on-surface">Wallpaper*</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button className="hero-gradient text-on-primary text-xs font-bold px-4 py-2.5 rounded-md hover:opacity-90">Открыть контакты</button>
                <Link href="/company" className="bg-surface-container-high text-primary text-xs font-bold px-4 py-2.5 rounded-md hover:bg-surface-container-highest transition-colors">Открыть профиль</Link>
              </div>
            </div>
          </article>

          {/* Card 4 */}
          <article className="bg-surface-container-lowest p-8 rounded-none flex flex-col md:flex-row gap-8 hover:bg-surface-container-low transition-all duration-500 relative group overflow-hidden">
            <div className="w-full md:w-56 h-64 flex-shrink-0 overflow-hidden rounded-lg">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Современный офис" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-primary mb-1">T+T Architects</h2>
                  <div className="flex gap-2">
                    <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Проверен</span>
                    <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Активен</span>
                  </div>
                </div>
                <button className="text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-xl">bookmark_add</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Тип объекта</p>
                  <p className="text-sm font-semibold text-on-surface">Офисы, Городские</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Сегмент</p>
                  <p className="text-sm font-semibold text-on-surface">Средний</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Проекты</p>
                  <p className="text-sm font-semibold text-on-surface">210 кейсов</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Публикации</p>
                  <p className="text-sm font-semibold text-on-surface">Archi.ru</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button className="hero-gradient text-on-primary text-xs font-bold px-4 py-2.5 rounded-md hover:opacity-90">Открыть контакты</button>
                <Link href="/company" className="bg-surface-container-high text-primary text-xs font-bold px-4 py-2.5 rounded-md hover:bg-surface-container-highest transition-colors">Открыть профиль</Link>
              </div>
            </div>
          </article>
        </div>

        {/* Pagination */}
        <div className="mt-20 flex items-center justify-between border-t border-outline-variant pt-8">
          <span className="text-xs font-bold text-outline tracking-widest uppercase">Показано 1-12 из 842 специалистов</span>
          <div className="flex gap-4">
            <button className="text-primary p-2 hover:bg-primary/5 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
            <div className="flex items-center gap-6 px-4">
              <span className="text-sm font-bold text-primary">01</span>
              <span className="text-sm font-medium text-outline">02</span>
              <span className="text-sm font-medium text-outline">03</span>
              <span className="text-sm font-medium text-outline">...</span>
              <span className="text-sm font-medium text-outline">42</span>
            </div>
            <button className="text-primary p-2 hover:bg-primary/5 rounded-full"><span className="material-symbols-outlined">arrow_forward</span></button>
          </div>
        </div>
      </main>
    </div>
  );
}
