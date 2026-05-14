"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu({ session }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2" aria-label="Меню">
        <span className="material-symbols-outlined text-2xl text-slate-700">
          {open ? "close" : "menu"}
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t border-slate-100 py-4 px-8 space-y-4 z-50">
          <Link href="/contractors" onClick={() => setOpen(false)} className="block text-slate-700 font-semibold hover:text-primary">Подрядчики</Link>
          <Link href="/designers" onClick={() => setOpen(false)} className="block text-slate-700 font-semibold hover:text-primary">Дизайнеры</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="block text-slate-700 font-semibold hover:text-primary">Тарифы</Link>
          <Link href="/post-project" onClick={() => setOpen(false)} className="block text-slate-700 font-semibold hover:text-primary">Разместить проект</Link>
          {session ? (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block text-primary font-bold">Личный кабинет</Link>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="block text-primary font-bold">Войти</Link>
          )}
        </div>
      )}
    </div>
  );
}
