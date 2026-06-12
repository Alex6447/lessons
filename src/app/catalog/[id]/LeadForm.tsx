"use client";

import { useActionState } from "react";
import { submitLeadAction } from "@/app/actions/public";

export function LeadForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(submitLeadAction, {});

  if (state?.ok) {
    return (
      <div className="card p-5 bg-[var(--color-brand-50)]">
        <h3 className="font-bold mb-1">Заявка отправлена!</h3>
        <p className="text-sm text-[var(--color-muted)]">
          Преподаватель свяжется с вами по указанному контакту.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-3">Оставить заявку</h3>
      <form action={action} className="space-y-3">
        <input type="hidden" name="courseId" value={courseId} />
        <div>
          <label className="label">Ваше имя</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="label">Email или телефон</label>
          <input className="input" name="contact" required />
        </div>
        <div>
          <label className="label">Сообщение</label>
          <textarea className="textarea" name="message" rows={3} placeholder="Расскажите о цели обучения" />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button className="btn btn-primary w-full" type="submit" disabled={pending}>
          {pending ? "Отправляем…" : "Отправить заявку"}
        </button>
      </form>
    </div>
  );
}
