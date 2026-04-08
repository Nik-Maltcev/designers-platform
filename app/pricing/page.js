import Link from "next/link";
import PayButton from "../components/PayButton";

export const metadata = {
  title: "Тарифы — ПроектЛист",
  description: "Тарифные планы для подрядчиков и поставщиков. Получайте дизайнеров, входящие запросы и приоритет в каталоге.",
};

export default function PricingPage() {
  return (
    <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
      {/* Header Section */}
      <header className="mb-20 text-center md:text-left max-w-4xl">
        <span className="inline-block py-1 px-3 mb-6 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold text-xs uppercase tracking-widest">Тарифные планы</span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.1] mb-8 font-headline">
          Получайте дизайнеров, входящие запросы и приоритет в каталоге
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Инструменты для масштабирования бизнеса подрядчиков. Управляйте видимостью, получайте проверенные лиды и работайте с лучшими архитекторами страны.
        </p>
      </header>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-32">
        {/* Free Plan */}
        <div className="lg:col-span-5 bg-surface-container-low p-8 md:p-12 rounded-xl flex flex-col h-full group hover:bg-surface-container transition-colors duration-500">
          <div className="mb-10">
            <h3 className="text-2xl font-bold font-headline mb-2 text-on-surface">Бесплатный</h3>
            <div className="text-4xl font-black font-headline text-on-surface">0 ₽ <span className="text-sm font-normal text-on-surface-variant tracking-normal">навсегда</span></div>
          </div>
          <ul className="space-y-5 mb-12 flex-grow">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim mt-0.5">check_circle</span>
              <span className="text-on-surface-variant leading-tight">Заполнение профиля компании</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim mt-0.5">check_circle</span>
              <span className="text-on-surface-variant leading-tight">Редактирование информации</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim mt-0.5">check_circle</span>
              <span className="text-on-surface-variant leading-tight">До 3 проектов в портфолио</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim mt-0.5">check_circle</span>
              <span className="text-on-surface-variant leading-tight">Верификация запросов</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-outline mt-0.5">info</span>
              <span className="text-on-surface-variant leading-tight">Просмотры дизайнеров (20/мес)</span>
            </li>
          </ul>
          <button className="w-full py-4 rounded-md font-bold text-on-primary-container bg-surface-container-high hover:bg-outline-variant transition-colors duration-200">
            Заполнить карточку компании
          </button>
        </div>

        {/* Pro Plan */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-primary/5 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-6 right-6">
            <span className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg">Рекомендуем</span>
          </div>
          <div className="mb-10 relative z-10">
            <h3 className="text-2xl font-bold font-headline mb-2 text-primary">Профи</h3>
            <div className="text-4xl md:text-5xl font-black font-headline text-on-surface">29 990 ₽ <span className="text-sm font-normal text-on-surface-variant tracking-normal">/год</span></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-12 flex-grow relative z-10">
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>stars</span>
                <span className="text-on-surface font-semibold leading-tight">Полный доступ к дизайнерам</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>keyboard_double_arrow_up</span>
                <span className="text-on-surface font-semibold leading-tight">Приоритет в каталоге</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>move_to_inbox</span>
                <span className="text-on-surface font-semibold leading-tight">Входящие отклики</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>notifications_active</span>
                <span className="text-on-surface font-semibold leading-tight">Уведомления о проектах</span>
              </li>
            </ul>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
                <span className="text-on-surface font-semibold leading-tight">Кураторский подбор</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>badge</span>
                <span className="text-on-surface font-semibold leading-tight">Расширенный профиль</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
                <span className="text-on-surface font-semibold leading-tight">Статистика просмотров</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>layers</span>
                <span className="text-on-surface font-semibold leading-tight">До 100 проектов</span>
              </li>
            </ul>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-4">
            <PayButton />
            <div className="hidden md:flex items-center justify-center p-5 rounded-md bg-secondary-container/30">
              <span className="material-symbols-outlined text-primary">security</span>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Comparison Table */}
      <section className="mt-32">
        <h2 className="text-3xl font-bold font-headline mb-12 text-center">Детальное сравнение возможностей</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="p-6 font-headline font-bold text-lg w-2/4">Функция</th>
                <th className="p-6 font-headline font-bold text-lg text-center w-1/4">Бесплатный</th>
                <th className="p-6 font-headline font-bold text-lg text-center w-1/4 text-primary">Профи</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              <tr className="group hover:bg-surface-container-lowest transition-colors">
                <td className="p-6 text-on-surface-variant">Количество проектов в портфолио</td>
                <td className="p-6 text-center font-semibold">3</td>
                <td className="p-6 text-center font-bold text-primary bg-primary/5">100</td>
              </tr>
              <tr className="group hover:bg-surface-container-lowest transition-colors">
                <td className="p-6 text-on-surface-variant">Позиция в общем каталоге</td>
                <td className="p-6 text-center">Стандартная</td>
                <td className="p-6 text-center font-bold text-primary bg-primary/5">Приоритетная</td>
              </tr>
              <tr className="group hover:bg-surface-container-lowest transition-colors">
                <td className="p-6 text-on-surface-variant">Просмотр карточек дизайнеров</td>
                <td className="p-6 text-center">Лимит 20/мес</td>
                <td className="p-6 text-center font-bold text-primary bg-primary/5">Безлимитно</td>
              </tr>
              <tr className="group hover:bg-surface-container-lowest transition-colors">
                <td className="p-6 text-on-surface-variant">Верифицированные входящие лиды</td>
                <td className="p-6 text-center">
                  <span className="material-symbols-outlined text-outline">close</span>
                </td>
                <td className="p-6 text-center bg-primary/5">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </td>
              </tr>
              <tr className="group hover:bg-surface-container-lowest transition-colors">
                <td className="p-6 text-on-surface-variant">Рекомендации кураторов сервиса</td>
                <td className="p-6 text-center">
                  <span className="material-symbols-outlined text-outline">close</span>
                </td>
                <td className="p-6 text-center bg-primary/5">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </td>
              </tr>
              <tr className="group hover:bg-surface-container-lowest transition-colors">
                <td className="p-6 text-on-surface-variant">Аналитика просмотров и охвата</td>
                <td className="p-6 text-center text-xs text-outline">Базовая</td>
                <td className="p-6 text-center font-bold text-primary bg-primary/5">Расширенная</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust Elements */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-8 rounded-xl">
          <span className="material-symbols-outlined text-primary text-3xl mb-4">verified</span>
          <h4 className="font-bold font-headline text-lg mb-2">Статус «Проверен»</h4>
          <p className="text-sm text-on-surface-variant">Компании с Профи-аккаунтом проходят ручную модерацию и получают знак доверия.</p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl">
          <span className="material-symbols-outlined text-primary text-3xl mb-4">groups</span>
          <h4 className="font-bold font-headline text-lg mb-2">3500+ дизайнеров</h4>
          <p className="text-sm text-on-surface-variant">Ваш профиль увидят ведущие архитекторы и дизайнеры интерьеров.</p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl">
          <span className="material-symbols-outlined text-primary text-3xl mb-4">support_agent</span>
          <h4 className="font-bold font-headline text-lg mb-2">Персональный куратор</h4>
          <p className="text-sm text-on-surface-variant">Помощь в оформлении портфолио для максимальной конверсии в заказы.</p>
        </div>
      </div>
    </main>
  );
}
