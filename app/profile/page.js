"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const roles = [
  { value: "designer", label: "Дизайнер интерьера" },
  { value: "architect", label: "Архитектор" },
  { value: "completer", label: "Комплектатор" },
  { value: "contractor", label: "Подрядчик / Производство" },
  { value: "supplier", label: "Поставщик" },
];

const cities = [
  "Москва", "Санкт-Петербург", "Краснодар", "Екатеринбург",
  "Новосибирск", "Казань", "Сочи", "Другой",
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "",
    companyName: "",
    city: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name || data.role) setForm(data);
      })
      .catch(() => {});
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка сохранения");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary">Профиль сохранён</h1>
          <p className="text-on-surface-variant">Перенаправляем в личный кабинет...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
      <header className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">
          Заполните профиль
        </h1>
        <p className="text-on-surface-variant">
          Расскажите о себе, чтобы мы могли подобрать для вас лучших партнёров
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Роль */}
        <section className="space-y-4">
          <label className="block font-headline font-bold text-sm uppercase tracking-widest text-primary">
            Кто вы? <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  form.role === r.value
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/30 hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={handleChange}
                  className="text-primary focus:ring-primary"
                />
                <span className={`font-medium ${form.role === r.value ? "text-primary font-bold" : ""}`}>
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Имя и телефон */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-xs font-bold text-outline uppercase tracking-widest">
              Имя и фамилия <span className="text-error">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Константин Иванов"
              className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-xs font-bold text-outline uppercase tracking-widest">
              Телефон
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+7 (___) ___-__-__"
              className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </section>

        {/* Компания и город */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-xs font-bold text-outline uppercase tracking-widest">
              Название компании / студии
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Studio 54"
              className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="city" className="text-xs font-bold text-outline uppercase tracking-widest">
              Город
            </label>
            <select
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              <option value="">Выберите город</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <p className="text-error text-sm font-medium">{error}</p>
        )}

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || !form.name || !form.role}
            className="hero-gradient text-on-primary px-10 py-4 rounded-lg font-headline font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Сохраняем..." : "Сохранить профиль"}
          </button>
          <Link href="/dashboard" className="text-on-surface-variant hover:text-primary text-sm font-medium">
            Пропустить
          </Link>
        </div>
      </form>
    </main>
  );
}
