"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function PostProjectPage() {
  const router = useRouter();
  const [level, setLevel] = useState("medium-plus");
  const [files, setFiles] = useState([]);
  const [showCurator, setShowCurator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(null);

  function handleFiles(e) {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const data = {
      role: fd.get("role"),
      category: fd.get("category"),
      location: fd.get("location"),
      objectType: fd.get("objectType"),
      level,
      urgency: fd.get("urgency"),
      description: fd.get("description"),
      contactName: fd.get("contactName"),
      contactPhone: fd.get("contactPhone"),
      contactEmail: fd.get("contactEmail"),
      hidePhone: fd.get("hidePhone") === "on",
    };
    try {
      const res = await fetch("/api/project-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {}
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <main className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary">Проект отправлен</h1>
          <p className="text-on-surface-variant">Мы подберём 3-5 подрядчиков в течение 48 часов и свяжемся с вами.</p>
          <button onClick={() => router.push("/my-requests")} className="hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">Мои запросы</button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <header className="mb-16 mt-8 max-w-3xl">
        <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-primary leading-tight mb-6">
          Получите 3-5 подрядчиков под ваш проект за 48 часов
        </h1>
        <p className="text-xl text-on-surface-variant leading-relaxed opacity-80">
          Подберем компании по категории, бюджету и типу объекта
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-12">
            <section className="bg-surface-container-low p-8 rounded-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block font-headline font-bold text-sm uppercase tracking-widest text-primary">Кто вы?</label>
                  <div className="relative">
                    <select name="role" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none">
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
                    <select name="category" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none">
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

            <section className="space-y-8">
              <h3 className="font-headline font-bold text-2xl text-primary">Характеристики объекта</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase">Расположение объекта</label>
                  <input name="location" className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="Москва, Россия" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase">Тип объекта</label>
                  <select name="objectType" className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none">
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
                    {[
                      { value: "medium", label: "Средний" },
                      { value: "medium-plus", label: "Средний+" },
                      { value: "premium", label: "Премиум" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLevel(opt.value)}
                        className={`flex-1 rounded-md text-xs font-bold transition-all ${
                          level === opt.value
                            ? "bg-white text-primary shadow-sm"
                            : "text-on-surface-variant hover:bg-white/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-headline font-bold text-sm uppercase tracking-widest text-primary">Срочность</label>
                <div className="flex flex-wrap gap-3">
                  {["Срочно", "2 недели", "Месяц", "Позже"].map((u, i) => (
                    <label key={u} className="cursor-pointer">
                      <input className="hidden peer" name="urgency" type="radio" value={u} defaultChecked={i === 1} />
                      <span className="px-6 py-3 rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block font-medium">{u}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Описание проекта</label>
                <textarea name="description" className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 resize-none" placeholder="Опишите требования, стилистические предпочтения или технические ограничения..." rows="4"></textarea>
              </div>
            </section>

            <section className="bg-surface-container-lowest p-8 rounded-xl border-2 border-dashed border-outline-variant/30 text-center">
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.dwg,.dxf" className="hidden" onChange={handleFiles} />
              <div className="max-w-xs mx-auto space-y-4">
                <span className="material-symbols-outlined text-5xl text-primary/40">cloud_upload</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">Загрузка файлов</h4>
                  <p className="text-sm text-on-surface-variant">Чертежи, визуализации, фотографии</p>
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-primary font-bold text-sm underline underline-offset-4">Выбрать файлы</button>
              </div>
              {files.length > 0 && (
                <div className="mt-6 space-y-2 text-left">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-container-low px-4 py-2 rounded-lg">
                      <span className="text-sm truncate">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-erro
r text-xs hover:text-error/80">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Имя</label>
                <input name="contactName" className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="Константин" type="text" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Телефон</label>
                <input className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" name="contactPhone" placeholder="+7 (___) ___-__-__" type="tel" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Эл. почта</label>
                <input className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" name="contactEmail" placeholder="name@company.ru" type="email" />
              </div>
            </section>

            <footer className="space-y-8 pt-8 border-t border-outline-variant/20">
              <div className="flex items-start gap-4 p-4 bg-secondary-container/30 rounded-lg">
                <div className="flex items-center h-6">
                  <input className="w-5 h-5 text-primary border-outline rounded focus:ring-primary" type="checkbox" name="hidePhone" />
                </div>
                <label className="text-sm font-medium leading-relaxed">
                  Не показывать мой телефон подрядчикам без согласия.
                  <span className="block text-xs text-on-surface-variant mt-1">Мы передадим ваш контакт только после того, как вы одобрите конкретное предложение куратора.</span>
                </label>
              </div>
              <button disabled={submitting} className="w-full md:w-auto hero-gradient text-on-primary px-12 py-5 rounded-lg font-headline font-bold text-xl shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50" type="submit">
                {submitting ? "Отправляем..." : "Отправить проект на подбор"}
              </button>
            </footer>
          </form>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="sticky top-32 space-y-8">
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

            <button type="button" onClick={() => setShowCurator(true)} className="w-full p-6 bg-white rounded-xl flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-secondary-fixed rounded-full overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">support_agent</span>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-outline uppercase tracking-wider">Нужна помощь?</p>
                <p className="text-sm font-semibold">Напишите куратору</p>
              </div>
            </button>
          </div>
        </aside>
      </div>

      {showCurator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowCurator(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">support_agent</span>
              <h3 className="font-headline font-bold text-xl text-primary">Связаться с куратором</h3>
            </div>
            <p className="text-on-surface-variant">Напишите нам, и куратор свяжется с вами в течение рабочего дня.</p>
            <p className="text-primary font-bold">support@projektlist.ru</p>
            <button onClick={() => setShowCurator(false)} className="w-full py-3 bg-surface-container-high rounded-lg font-bold text-sm hover:bg-surface-container-highest transition-colors">Закрыть</button>
          </div>
        </div>
      )}
    </main>
  );
}
