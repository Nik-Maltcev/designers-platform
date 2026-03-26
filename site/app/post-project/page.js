export const metadata = {
  title: "Отправить проект на подбор — ПроектЛист",
  description: "Заполните форму и получите 3-5 подрядчиков под ваш проект за 48 часов.",
};

export default function PostProjectPage() {
  return (
    <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <header className="mb-16 mt-8 max-w-3xl">
        <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-primary leading-tight mb-6">
          Получите 3-5 подрядчиков под ваш проект за 48 часов
        </h1>
        <p className="text-xl text-on-surface-variant leading-relaxed opacity-80">
          Подберем компании по категории, бюджету и типу объекта
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Form */}
        <div className="lg:col-span-8">
          <form className="space-y-12">
            {/* Section: Role & Category */}
            <section className="bg-surface-container-low p-8 rounded-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block font-headline font-bold text-sm uppercase tracking-widest text-primary">Кто вы?</label>
                  <div className="relative">
                    <select className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none">
                      <option>Дизайнер</option>
                      <option>Архитектор</option>
                      <option>Комплектатор</option>
                      <option>Собственник</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block font-headline font-bold text-sm uppercase tracking-widest text-primary">Что подбираем?</label>
                  <div className="relative">
                    <select className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none">
                      <option>Мебель</option>
                      <option>Освещение</option>
                      <option>Отделочные материалы</option>
                      <option>Инженерные системы</option>
                      <option>Комплексный ремонт</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Object Details */}
            <section className="space-y-8">
              <h3 className="font-headline font-bold text-2xl text-primary">Характеристики объекта</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase">Расположение объекта</label>
                  <input className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="Москва, Россия" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase">Тип объекта</label>
                  <select className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none">
                    <option>Квартира</option>
                    <option>Дом</option>
                    <option>Офис</option>
                    <option>Ритейл</option>
                    <option>HoReCa</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase">Уровень проекта</label>
                  <div className="flex bg-surface-container-low rounded-lg p-1 h-[56px]">
                    <button className="flex-1 rounded-md text-xs font-bold text-on-surface-variant hover:bg-white transition-all" type="button">Средний</button>
                    <button className="flex-1 rounded-md text-xs font-bold bg-white text-primary shadow-sm" type="button">Средний+</button>
                    <button className="flex-1 rounded-md text-xs font-bold text-on-surface-variant hover:bg-white transition-all" type="button">Премиум</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-headline font-bold text-sm uppercase tracking-widest text-primary">Срочность</label>
                <div className="flex flex-wrap gap-3">
                  <label className="cursor-pointer group">
                    <input className="hidden peer" name="urgency" type="radio" />
                    <span className="px-6 py-3 rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block font-medium">Срочно</span>
                  </label>
                  <label className="cursor-pointer group">
                    <input className="hidden peer" name="urgency" type="radio" defaultChecked />
                    <span className="px-6 py-3 rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block font-medium">2 недели</span>
                  </label>
                  <label className="cursor-pointer group">
                    <input className="hidden peer" name="urgency" type="radio" />
                    <span className="px-6 py-3 rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block font-medium">Месяц</span>
                  </label>
                  <label className="cursor-pointer group">
                    <input className="hidden peer" name="urgency" type="radio" />
                    <span className="px-6 py-3 rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block font-medium">Позже</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Описание проекта</label>
                <textarea className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 resize-none" placeholder="Опишите требования, стилистические предпочтения или технические ограничения..." rows="4"></textarea>
              </div>
            </section>

            {/* Section: Upload */}
            <section className="bg-surface-container-lowest p-8 rounded-xl border-2 border-dashed border-outline-variant/30 text-center">
              <div className="max-w-xs mx-auto space-y-4">
                <span className="material-symbols-outlined text-5xl text-primary/40">cloud_upload</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">Загрузка файлов</h4>
                  <p className="text-sm text-on-surface-variant">Чертежи, визуализации, фотографии</p>
                </div>
                <button className="text-primary font-bold text-sm underline underline-offset-4" type="button">Выбрать файлы</button>
              </div>
            </section>

            {/* Section: Contact Info */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Имя</label>
                <input className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="Константин" type="text" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Телефон</label>
                <input className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="+7 (___) ___-__-__" type="tel" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Эл. почта</label>
                <input className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="k.arch@studio.com" type="email" />
              </div>
            </section>

            {/* Section: Submit & Privacy */}
            <footer className="space-y-8 pt-8 border-t border-outline-variant/20">
              <div className="flex items-start gap-4 p-4 bg-secondary-container/30 rounded-lg">
                <div className="flex items-center h-6">
                  <input className="w-5 h-5 text-primary border-outline rounded focus:ring-primary" type="checkbox" />
                </div>
                <label className="text-sm font-medium leading-relaxed">
                  Не показывать мой телефон подрядчикам без согласия.
                  <span className="block text-xs text-on-surface-variant mt-1">Мы передадим ваш контакт только после того, как вы одобрите конкретное предложение куратора.</span>
                </label>
              </div>
              <button className="w-full md:w-auto hero-gradient text-on-primary px-12 py-5 rounded-lg font-headline font-bold text-xl shadow-xl hover:scale-[1.02] transition-transform" type="submit">
                Отправить проект на подбор
              </button>
            </footer>
          </form>
        </div>

        {/* Right Column: Context/Trust */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="sticky top-32 space-y-8">
            {/* Info Card */}
            <div className="bg-primary text-on-primary p-8 rounded-xl space-y-6">
              <h4 className="font-headline font-bold text-2xl">Как это работает</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                  <p className="text-sm opacity-90">Заполните форму с деталями вашего проекта и требованиями.</p>
                </div>
                <div className="flex gap-4">
                  <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                  <p className="text-sm opacity-90">Наши кураторы вручную подберут лучших проверенных подрядчиков.</p>
                </div>
                <div className="flex gap-4">
                  <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                  <p className="text-sm opacity-90">Получите 3-5 персональных предложений в течение 48 часов.</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                <span className="font-headline font-bold text-lg">Верифицированная экосистема</span>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Активных подрядчиков</span>
                  <span className="font-bold">2 400+</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Точность подбора</span>
                  <span className="font-bold text-primary">98,4%</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Среднее время ответа</span>
                  <span className="font-bold">14 часов</span>
                </li>
              </ul>
            </div>

            {/* Support Card */}
            <div className="p-6 bg-white rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-fixed rounded-full overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">support_agent</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-wider">Нужна помощь?</p>
                <p className="text-sm font-semibold">Напишите куратору</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
