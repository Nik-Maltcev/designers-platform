"use client";

import { useState } from "react";

export default function PayButton() {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", { method: "POST" });
      const data = await res.json();
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else if (data.error) {
        alert(data.error === "Не авторизован" ? "Войдите в аккаунт чтобы оплатить" : data.error);
      }
    } catch {
      alert("Ошибка при создании платежа");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="hero-gradient text-on-primary px-10 py-5 rounded-md font-bold text-lg flex-grow hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50"
    >
      {loading ? "Переход к оплате..." : "Подключить Профи"}
    </button>
  );
}
