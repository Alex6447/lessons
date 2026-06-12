import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/lib/nav";

export default async function StudentCoursesPage() {
  const student = await requireStudent();
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.uid, tenantId: student.tenantId },
    include: { course: { include: { _count: { select: { modules: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Мои курсы" nav={studentNav} userName={student.name}>
      {enrollments.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-muted)]">Курсов пока нет.</div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => (
            <Link key={e.id} href={`/student/courses/${e.course.id}`} className="card p-5 flex items-center justify-between hover:border-[var(--color-brand-300)] transition">
              <div>
                <h3 className="font-bold">{e.course.title}</h3>
                <p className="text-sm text-[var(--color-muted)]">{e.course._count.modules} модулей · {e.progressPct}% пройдено</p>
              </div>
              <span className="text-[var(--color-brand-600)]">→</span>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
