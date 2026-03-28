import Link from "next/link";

export const metadata = {
  title: "Подрядчики и производства — ПроектЛист",
  description: "Каталог проверенных подрядчиков и производств. Мебель, освещение, отделка, двери и окна.",
};

export default function ContractorsPage() {
  return (
    <div className="flex min-h-screen pt-20">
      {/* Main Content Area */}
      <main className="flex-1 px-8 pb-12">
        {/* Header */}
        <header className="py-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-6xl font-extrabold tracking-tighter font-headline text-primary">Подрядчики и производства</h1>
              <p className="text-on-surface-variant max-w-md">Найдите проверенных партнеров для реализации ваших самых смелых архитектурных и интерьерных идей.</p>
            </div>
          </div>
          {/* Search and Controls */}
          <div className="mt-12 flex flex-col gap-6">
            <div className="relative w-full max-w-4xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full pl-12 pr-4 py-5 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/40 transition-all text-lg shadow-sm" placeholder="Например: корпусная мебель, загородные дома, Москва" type="text" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
              <span className="text-on-surface-variant mr-2">Сортировать по:</span>
              <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-full hover:bg-surface-container-low transition-colors">Сходство проектов</button>
              <button className="px-4 py-2 bg-primary text-on-primary rounded-full">Активность</button>
              <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-full hover:bg-surface-container-low transition-colors">Масштаб</button>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto items-start">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 glass-sidebar sticky top-24 p-6 rounded-2xl shadow-sm space-y-8">
            <div>
              <h3 className="font-headline font-bold text-lg mb-5">Категория</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="rounded-sm border-outline text-primary focus:ring-primary" type="checkbox" />
                  <span className="group-hover:text-primary transition-colors">Мебель</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="rounded-sm border-outline text-primary focus:ring-primary" type="checkbox" defaultChecked />
                  <span className="group-hover:text-primary transition-colors">Освещение</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="rounded-sm border-outline text-primary focus:ring-primary" type="checkbox" />
                  <span className="group-hover:text-primary transition-colors">Отделка</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="rounded-sm border-outline text-primary focus:ring-primary" type="checkbox" />
                  <span className="group-hover:text-primary transition-colors">Окна и двери</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg mb-5">Регион</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="border-outline text-primary focus:ring-primary" name="region" type="radio" defaultChecked />
                  <span>Москва</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="border-outline text-primary focus:ring-primary" name="region" type="radio" />
                  <span>МО</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input className="border-outline text-primary focus:ring-primary" name="region" type="radio" />
                  <span>Вся Россия</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg mb-5">Тип объекта</h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 bg-surface-container rounded-full text-xs font-semibold">Квартира</button>
                <button className="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-semibold">Дом</button>
                <button className="px-3 py-1.5 bg-surface-container rounded-full text-xs font-semibold">Офис</button>
                <button className="px-3 py-1.5 bg-surface-container rounded-full text-xs font-semibold">Отель</button>
                <button className="px-3 py-1.5 bg-surface-container rounded-full text-xs font-semibold">Ресторан / Кафе</button>
                <button className="px-3 py-1.5 bg-surface-container rounded-full text-xs font-semibold">Другое</button>
              </div>
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg mb-5">Сегмент</h3>
              <div className="space-y-2">
                <label className="flex justify-between items-center py-2 px-3 hover:bg-surface-container-low rounded-lg transition-all">
                  <span className="text-sm">Средний+</span>
                  <input className="rounded-full text-primary" type="checkbox" defaultChecked />
                </label>
                <label className="flex justify-between items-center py-2 px-3 hover:bg-surface-container-low rounded-lg transition-all">
                  <span className="text-sm">Премиум</span>
                  <input className="rounded-full text-primary" type="checkbox" />
                </label>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary-fixed/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                  <span className="text-sm font-bold text-on-primary-fixed-variant">Только проверенные</span>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </aside>

          {/* Grid List */}
          <div className="flex-1 grid grid-cols-1 gap-10">
            {/* Card 1 */}
            <article className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:translate-y-[-4px] transition-transform duration-300 shadow-sm">
              <div className="flex flex-col md:flex-row p-8 gap-8">
                <div className="w-full md:w-64 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Проверен
                      </span>
                      <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Активен</span>
                    </div>
                    <h2 className="text-2xl font-extrabold font-headline leading-tight">WoodLine Production</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Корпусная мебель, Изделия из массива, Лестницы</p>
                    <div className="flex items-center gap-1 text-xs text-outline pt-2">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      Москва, Московская область
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link href="/company" className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all hover:opacity-90 active:scale-95 text-center">Открыть профиль</Link>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg text-sm hover:bg-secondary-fixed transition-colors">Пригласить</button>
                      <button className="px-3 py-3 bg-surface-container rounded-lg text-primary hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined">bookmark</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                    <img alt="Кухня из массива" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRYIMmRh4umhUAYPZ1YoD_NrZXzDPvdnlFJnpZjC3qTspIu0TsuVmMYhozFG_eCLuncZ903V6YaKkYUhc0HzMz-n1Xdpw7L-m_F4NE5XodpbcCn_P7mxxbAsZ0E95_3bFQdOwyeMwNmK5YLQuhBVizLkLI2leDgHvDrDTU-zGMPaZPiUREeMDK9-cX_ECcyTLfgXnuNzB2k-VEMcdxawRQYmjcL-W2fSqT-8B-ScVlLChe_EZTRheujn2wfZJHPUE-AY6-YIKMvktR" />
                    <div className="absolute bottom-4 left-4 text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded">ВИЛЛА МАРИН</div>
                  </div>
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                    <img alt="Обеденный стол" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
                    <div className="absolute bottom-4 left-4 text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded">ЛОФТ КВАРТИРА</div>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:translate-y-[-4px] transition-transform duration-300 shadow-sm">
              <div className="flex flex-col md:flex-row p-8 gap-8">
                <div className="w-full md:w-64 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Проверен
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold font-headline leading-tight">Light Foundry Studio</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Дизайнерское освещение, Латунь, Стекло</p>
                    <div className="flex items-center gap-1 text-xs text-outline pt-2">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      Санкт-Петербург
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link href="/company" className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all hover:opacity-90 active:scale-95 text-center">Открыть профиль</Link>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg text-sm hover:bg-secondary-fixed transition-colors">Пригласить</button>
                      <button className="px-3 py-3 bg-surface-container rounded-lg text-primary hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined">bookmark</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                    <img alt="Люстра из латуни" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkLlMRvtZO5B55ojlPL59lherZW6idV7V6n3D1D4my1p-XAvvjNqZqYNpsE0dCGPJv3AnCu5pW6KoSdbmasOHL6pc7JKOE9Jf2QmOC3DCAziByFSacpy4AbBpp9L1E60OLqifUV7BGkzuqdlYyb91N9JzX6lX5MI0k8SfVAQ73V4ScSjvMruo3xnaj4btG1EUfyILCgpbb30ejmQQxsjO811XO-JoyLnO_7mDcvnQtBMajpUyhUsx5gcIFgABsf9F69Q5Qe8kPK5SC" />
                    <div className="absolute bottom-4 left-4 text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded">РЕЗИДЕНЦИЯ GLOW</div>
                  </div>
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                    <img alt="Стеклянные бра" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
                    <div className="absolute bottom-4 left-4 text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded">ОФИСНЫЙ ХАБ</div>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:translate-y-[-4px] transition-transform duration-300 shadow-sm border border-transparent hover:border-primary/10">
              <div className="flex flex-col md:flex-row p-8 gap-8">
                <div className="w-full md:w-64 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Активен</span>
                    </div>
                    <h2 className="text-2xl font-extrabold font-headline leading-tight">Stone Masters Co</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Натуральный камень, Мрамор, Столешницы</p>
                    <div className="flex items-center gap-1 text-xs text-outline pt-2">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      Москва
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link href="/company" className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all hover:opacity-90 active:scale-95 text-center">Открыть профиль</Link>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg text-sm hover:bg-secondary-fixed transition-colors">Пригласить</button>
                      <button className="px-3 py-3 bg-surface-container rounded-lg text-primary hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined">bookmark</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="col-span-2 relative aspect-video rounded-lg overflow-hidden bg-surface-container-high">
                    <img alt="Мраморный остров" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEE0h-4kZCW00h5Bw31uwjpmp9NDdTmQjIGOo_qKXH5wC2fo1g_reAcmwexz7IXqIKdxiGnjAY3Jy5qF-eSMZu-NzawIOdjfGFJAoHA2Jfn9ZJJEYzq_0N-sugNGloiMFGeqs3qV9R4xaxdGoW4Ux_W_h10Of1PF0f1ZY-bwLmoXWxoO7fpB7oIbF1MmhzPXJP9dsiQNf7DHwY-v6FDBc4xYT4nZrAMzhkjOLPZNWEIJWX9kemP10OX99bAV5JLANDl7xHEZJzoy0Y" />
                  </div>
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                    <img alt="Мраморная ванная" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3tHn44jcooANPCBa3wgTYQ48wud3NXBPufF3SOk47uMf2p4MRCUt0SeA9IGBX4ZtVyFFKgeiQZrCKiEJssGLHAJ7TNTk4Tq2r_vfuq-7Utf8JC4GjmJfnOEW9I5J_wTdU5ljcwgg0KapoXPVeWUExrfOmU-p9Vo9WqZDzaZZtgXRs9aU0O0oASCT6K2LohXPAmRBvflcEbPQ7vWRKBf2BbSeS6MoAWAcrHuIiHLWHJ-J-Pn9sH82Youix2UuSURHhfNLDwAor3Da" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
