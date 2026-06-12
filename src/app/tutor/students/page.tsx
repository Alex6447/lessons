import { prisma } from "@/lib/db";
import { requireTutor } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { tutorNav } from "@/lib/nav";
import { AddStudentForm } from "./AddStudentForm";

export default async function TutorStudentsPage() {
  const tutor = await requireTutor();
  const tenantId = tutor.tenantId;

  const [students, courses] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: "student" },
      include: { enrollments: { include: { course: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { tenantId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <DashboardShell title="Ученики" nav={tutorNav} userName={tutor.name}>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-3">
          {students.length === 0 && (
            <div className="card p-8 text-center text-[var(--color-muted)]">
              Учеников пока нет. Добавьте первого справа →
            </div>
          )}
          {students.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold">{s.name}</h3>
                <span className="text-sm text-[var(--color-muted)]">{s.email}</span>
              </div>
              {s.enrollments.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Не записан на курсы.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {s.enrollments.map((e) => (
                    <span key={e.id} className="badge badge-brand">
                      {e.course.title} · {e.progressPct}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <AddStudentForm courses={courses} />
      </div>
    </DashboardShell>
  );
}
