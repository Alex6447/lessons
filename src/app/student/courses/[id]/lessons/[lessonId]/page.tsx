import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/lib/nav";
import { setLessonProgressAction } from "@/app/actions/student";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const student = await requireStudent();

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.uid, courseId: id, tenantId: student.tenantId },
    select: { id: true },
  });
  if (!enrollment) notFound();

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId: id } },
    include: { module: true, assignments: true },
  });
  if (!lesson) notFound();

  // Flattened ordered lessons for prev/next.
  const all = await prisma.lesson.findMany({
    where: { module: { courseId: id } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true },
  });
  const idx = all.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  const progress = await prisma.progress.findUnique({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
  });
  const done = progress?.status === "done";

  return (
    <DashboardShell title={lesson.title} subtitle={`Модуль: ${lesson.module.title}`} nav={studentNav} userName={student.name}>
      <Link href={`/student/courses/${id}`} className="text-sm text-[var(--color-muted)]">← К программе курса</Link>

      <article className="card p-6 mt-4 max-w-3xl">
        <div className="prose-basic whitespace-pre-wrap text-[0.95rem] leading-relaxed">
          {lesson.content || "Материал этого урока ещё готовится."}
        </div>

        {lesson.diagram && (
          <div className="mt-5">
            <p className="label">Схема (Mermaid)</p>
            <pre className="rounded-lg bg-[#0f1729] text-[#d9e6ff] p-4 text-xs overflow-x-auto">{lesson.diagram}</pre>
          </div>
        )}

        {lesson.assignments.length > 0 && (
          <div className="mt-5">
            <h3 className="font-bold mb-2">Задания</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {lesson.assignments.map((a) => (
                <li key={a.id}>{a.title}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
          <form action={setLessonProgressAction}>
            <input type="hidden" name="courseId" value={id} />
            <input type="hidden" name="lessonId" value={lessonId} />
            <input type="hidden" name="done" value={(!done).toString()} />
            <button className={`btn ${done ? "btn-ghost" : "btn-primary"}`} type="submit">
              {done ? "Отметить как непройденный" : "Отметить пройденным"}
            </button>
          </form>
          {done && <span className="badge badge-green">пройдено ✓</span>}
        </div>
      </article>

      <div className="flex items-center justify-between max-w-3xl mt-4">
        {prev ? (
          <Link href={`/student/courses/${id}/lessons/${prev.id}`} className="btn btn-ghost">← Предыдущий</Link>
        ) : <span />}
        {next ? (
          <Link href={`/student/courses/${id}/lessons/${next.id}`} className="btn btn-ghost">Следующий →</Link>
        ) : <span />}
      </div>
    </DashboardShell>
  );
}
