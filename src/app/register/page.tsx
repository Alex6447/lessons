"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerTutorAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerTutorAction, {});

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <div className="fixed top-4 right-4"><ThemeToggle /></div>
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-sm text-[var(--color-muted)]">
          ← На главную
        </Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">Регистрация репетитора</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Создайте рабочий кабинет — это ваше отдельное пространство с учениками и курсами.
        </p>

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Ваше имя</label>
            <input className="input" id="name" name="name" required placeholder="Анна Петрова" />
          </div>
          <div>
            <label className="label" htmlFor="workspace">Название кабинета</label>
            <input className="input" id="workspace" name="workspace" required placeholder="Анна Петрова — математика" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Пароль</label>
            <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button className="btn btn-primary w-full" type="submit" disabled={pending}>
            {pending ? "Создаём кабинет…" : "Создать кабинет"}
          </button>
        </form>

        <p className="text-sm text-[var(--color-muted)] mt-6 text-center">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[var(--color-brand-600)] font-semibold">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
