"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { signIn } = await import("next-auth/react");
      await signIn("nodemailer", { email, callbackUrl: "/dashboard" });
    } catch {
      setError("Не удалось отправить ссылку. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <main className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">
            Вход в ПроектЛист
          </h1>
          <p className="text-on-surface-variant">
            Введите email — мы отправим ссылку для входа
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold text-outline uppercase tracking-widest">
              Электронная почта
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.ru"
              className="w-full bg-surface-container-high border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/40 transition-all text-lg"
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full hero-gradient text-on-primary py-4 rounded-lg font-headline font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Отправляем..." : "Получить ссылку для входа"}
          </button>

          <p className="text-xs text-on-surface-variant text-center leading-relaxed">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <Link href="#" className="text-primary underline">правилами пользования сервисом</Link>
            {" "}и{" "}
            <Link href="#" className="text-primary underline">политикой конфиденциальности</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
