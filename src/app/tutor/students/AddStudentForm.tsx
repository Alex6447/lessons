"use client";

import { useActionState } from "react";
import { addStudentAction } from "@/app/actions/tutor";

type Course = { id: string; title: string };

export function AddStudentForm({ courses }: { courses: Course[] }) {
  const [state, action, pending] = useActionState(addStudentAction, {});

  return (
    <div className="card p-5 h-fit">
      <h2 className="font-bold mb-4">Добавить ученика</h2>
      <form action={action} className="space-y-3">
        <div>
          <label className="label">Имя</label>
          <input className="input" name="name" required placeholder="Иван Смирнов" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" name="email" type="email" required />
        </div>
        <div>
          <label className="label">Записать на курс (опционально)</label>
          <select className="select" name="courseId" defaultValue="">
            <option value="">— не записывать —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.tempPassword && (
          <div className="rounded-lg bg-[var(--color-brand-50)] p-3 text-xs">
            <p className="font-semibold mb-1">Ученик создан.</p>
            <p>Временный пароль: <code className="font-mono">{state.tempPassword}</code></p>
            <p className="text-[var(--color-muted)] mt-1">Передайте его ученику — он сменит пароль позже.</p>
          </div>
        )}
        <button className="btn btn-primary w-full" type="submit" disabled={pending}>
          {pending ? "Добавляем…" : "Добавить"}
        </button>
      </form>
    </div>
  );
}
