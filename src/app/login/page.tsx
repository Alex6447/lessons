"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="fixed top-4 right-4"><ThemeToggle /></div>
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-sm text-[var(--color-muted)]">
          ← На главную
        </Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">Вход</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Войдите в свой кабинет.
        </p>

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Пароль</label>
            <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button className="btn btn-primary w-full" type="submit" disabled={pending}>
            {pending ? "Входим…" : "Войти"}
          </button>
        </form>

        <p className="text-sm text-[var(--color-muted)] mt-6 text-center">
          Нет аккаунта репетитора?{" "}
          <Link href="/register" className="text-[var(--color-brand-600)] font-semibold">
            Зарегистрироваться
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-[var(--color-brand-50)] p-3 text-xs text-[var(--color-muted)]">
          <p className="font-semibold mb-1">Демо-доступы:</p>
          <p>Репетитор: tutor@lessons.dev / tutor12345</p>
          <p>Ученик: student@lessons.dev / student12345</p>
          <p>Админ: admin@lessons.dev / admin12345</p>
        </div>
      </div>
    </main>
  );
}
