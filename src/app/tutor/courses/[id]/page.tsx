import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireTutor } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { tutorNav } from "@/lib/nav";
import {
  updateCourseAction,
  togglePublishAction,
  addModuleAction,
  addLessonAction,
  updateLessonAction,
  deleteLessonAction,
} from "@/app/actions/tutor";

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutor = await requireTutor();

  const course = await prisma.course.findFirst({
    where: { id, tenantId: tutor.tenantId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  const published = course.status === "published";

  return (
    <DashboardShell title={course.title} subtitle="Конструктор курса" nav={tutorNav} userName={tutor.name}>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/tutor/courses" className="text-sm text-[var(--color-muted)]">← Все курсы</Link>
        <span className={`badge ${published ? "badge-green" : "badge-amber"}`}>
          {published ? "опубликован" : "черновик"}
        </span>
        <form action={togglePublishAction} className="ml-auto">
          <input type="hidden" name="courseId" value={course.id} />
          <button className={`btn ${published ? "btn-ghost" : "btn-primary"}`} type="submit">
            {published ? "Снять с публикации" : "Опубликовать"}
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Structure */}
        <div className="space-y-4">
          {course.modules.length === 0 && (
            <div className="card p-6 text-center text-[var(--color-muted)]">
              Пока нет модулей. Добавьте первый ниже.
            </div>
          )}

          {course.modules.map((m) => (
            <div key={m.id} className="card p-5">
              <h3 className="font-bold mb-3">
                Модуль {m.order}. {m.title}
              </h3>

              <div className="space-y-2 mb-3">
                {m.lessons.length === 0 && (
                  <p className="text-sm text-[var(--color-muted)]">Уроков пока нет.</p>
                )}
                {m.lessons.map((l) => (
                  <details key={l.id} className="rounded-lg border border-[var(--color-border)]">
                    <summary className="px-3 py-2 cursor-pointer text-sm font-medium flex items-center justify-between">
                      <span>Урок {l.order}. {l.title}</span>
                    </summary>
                    <div className="p-3 border-t border-[var(--color-border)]">
                      <form action={updateLessonAction} className="space-y-2">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="lessonId" value={l.id} />
                        <div>
                          <label className="label">Название урока</label>
                          <input className="input" name="title" defaultValue={l.title} />
                        </div>
                        <div>
                          <label className="label">Содержание (Markdown)</label>
                          <textarea className="textarea" name="content" rows={4} defaultValue={l.content} />
                        </div>
                        <div>
                          <label className="label">Диаграмма (Mermaid, опционально)</label>
                          <textarea className="textarea" name="diagram" rows={2} defaultValue={l.diagram} placeholder="graph TD; A-->B" />
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-primary" type="submit">Сохранить</button>
                        </div>
                      </form>
                      <form action={deleteLessonAction} className="mt-2">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="lessonId" value={l.id} />
                        <button className="btn btn-danger" type="submit">Удалить урок</button>
                      </form>
                    </div>
                  </details>
                ))}
              </div>

              <form action={addLessonAction} className="flex gap-2">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="moduleId" value={m.id} />
                <input className="input" name="title" placeholder="Название нового урока" />
                <button className="btn btn-ghost whitespace-nowrap" type="submit">+ Урок</button>
              </form>
            </div>
          ))}

          <form action={addModuleAction} className="card p-4 flex gap-2">
            <input type="hidden" name="courseId" value={course.id} />
            <input className="input" name="title" placeholder="Название нового модуля" />
            <button className="btn btn-primary whitespace-nowrap" type="submit">+ Модуль</button>
          </form>
        </div>

        {/* Settings */}
        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-4">Параметры курса</h2>
          <form action={updateCourseAction} className="space-y-3">
            <input type="hidden" name="courseId" value={course.id} />
            <div>
              <label className="label">Название</label>
              <input className="input" name="title" defaultValue={course.title} />
            </div>
            <div>
              <label className="label">Предмет</label>
              <input className="input" name="subject" defaultValue={course.subject} />
            </div>
            <div>
              <label className="label">Цель ученика</label>
              <textarea className="textarea" name="goal" rows={2} defaultValue={course.goal} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Уровень</label>
                <input className="input" name="level" defaultValue={course.level} />
              </div>
              <div>
                <label className="label">Возраст</label>
                <input className="input" name="ageGroup" defaultValue={course.ageGroup} />
              </div>
            </div>
            <div>
              <label className="label">Цена, ₽</label>
              <input className="input" name="priceRub" type="number" min={0} defaultValue={course.priceKopecks / 100} />
            </div>
            <button className="btn btn-primary w-full" type="submit">Сохранить</button>
          </form>

          <div className="mt-4 rounded-lg bg-[var(--color-brand-50)] p-3 text-xs text-[var(--color-muted)]">
            <p className="font-semibold mb-1">Скоро: ИИ-помощник</p>
            <p>По «цели ученика» ИИ соберёт черновик структуры курса (Этап 3 плана).</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
