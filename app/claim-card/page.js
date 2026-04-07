"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/claim-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSuccess(true);
      else {
        const d = await res.json();
        setError(d.error || "Ошибка");
      }
    } catch { setError("Ошибка сети"); }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary">Заявка принята</h1>
          <p className="text-on-surface-variant">Мы проверим данные и свяжемся с вами. Обычно это занимает 1-2 рабочих дня.</p>
          <button onClick={() => router.push("/dashboard")} className="hero-gradient text-on-primary px-8 py-3 rounded-lg font-bold">В личный кабинет</button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
      <header className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">Заберите карточку компании</h1>
        <p className="text-on-surface-variant">Подтвердите, что вы представляете компанию, и получите доступ к редактированию профиля.</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">Название компании *</label>
            <input name="companyName" required className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="ООО Мебельная мастерская" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">ИНН</label>
            <input name="inn" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="7707083893" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">Сайт</label>
            <input name="website" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="company.ru" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">Рабочий телефон</label>
            <input name="phone" type="tel" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="+7 (___) ___-__-__" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">Ваше имя</label>
            <input name="contactName" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="Иван Петров" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">Должность</label>
            <input name="position" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="Директор" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase">Почта</label>
            <input name="email" type="email" className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40" placeholder="ivan@company.ru" />
          </div>
        </div>
        {error && <p className="text-error text-sm font-medium">{error}</p>}
        <div className="space-y-4 pt-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" required className="mt-1 text-primary" />
            <span>Я представляю эту компанию и согласен на обработку данных</span>
          </label>
          <button type="submit" disabled={loading} className="hero-gradient text-on-primary px-10 py-4 rounded-lg font-headline font-bold text-lg disabled:opacity-50">
            {loading ? "Отправляем..." : "Забрать карточку"}
          </button>
        </div>
      </form>
    </main>
  );
}
