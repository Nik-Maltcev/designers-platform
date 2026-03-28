"use client";

import Link from "next/link";

export default function AuthButton({ session }) {
  async function handleSignOut() {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-slate-600 hover:text-primary transition-colors font-headline text-sm font-semibold"
        >
          {session.user.name || session.user.email?.split("@")[0]}
        </Link>
        <button
          onClick={handleSignOut}
          className="text-slate-400 hover:text-error transition-colors text-sm font-medium"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-slate-600 hover:text-primary transition-colors font-headline text-sm font-semibold"
    >
      Войти
    </Link>
  );
}
