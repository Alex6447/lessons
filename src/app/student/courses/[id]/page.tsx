import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/lib/nav";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await requireStudent();

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.uid, courseId: id, tenantId: student.tenantId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { lessons: { orderBy: { order: "asc" } } },
          },
        },
      },
      progress: true,
    },
  });
  if (!enrollment) notFound();

  const doneSet = new Set(
    enrollment.progress.filter((p) => p.status === "done").map((p) => p.lessonId)
  );

  return (
    <DashboardShell title={enrollment.course.title} subtitle={`${enrollment.progressPct}% пройдено`} nav={studentNav} userName={student.name}>
      <Link href="/student/courses" className="text-sm text-[var(--color-muted)]">← Мои курсы</Link>

      <div className="mt-4 space-y-4">
        {enrollment.course.modules.map((m) => (
          <div key={m.id} className="card p-5">
            <h3 className="font-bold mb-3">Модуль {m.order}. {m.title}</h3>
            <ul className="space-y-1">
              {m.lessons.map((l) => {
                const done = doneSet.has(l.id);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/student/courses/${id}/lessons/${l.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-brand-50)]"
                    >
                      <span className={`grid place-items-center w-5 h-5 rounded-full text-xs ${done ? "bg-[var(--color-brand-500)] text-white" : "bg-[var(--color-track)] text-[var(--color-muted)]"}`}>
                        {done ? "✓" : l.order}
                      </span>
                      <span className={done ? "text-[var(--color-muted)]" : ""}>{l.title}</span>
                    </Link>
                  </li>
                );
              })}
              {m.lessons.length === 0 && (
                <li className="text-sm text-[var(--color-muted)] px-3">Уроки скоро появятся.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
