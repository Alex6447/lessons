import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/lib/nav";

export default async function StudentDashboard() {
  const student = await requireStudent();
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.uid, tenantId: student.tenantId },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title={`Привет, ${student.name}`} subtitle="Ваш прогресс" nav={studentNav} userName={student.name}>
      {enrollments.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-muted)]">
          Вы пока не записаны на курсы. Их назначит ваш репетитор.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((e) => (
            <Link key={e.id} href={`/student/courses/${e.course.id}`} className="card p-5 hover:border-[var(--color-brand-300)] transition">
              <span className="badge badge-gray mb-2">{e.course.subject || "Курс"}</span>
              <h3 className="font-bold mb-3">{e.course.title}</h3>
              <Progress pct={e.progressPct} />
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Progress({ pct }: { pct: number }) {
  return (
    <div>
      <div className="h-2 rounded-full bg-[var(--color-track)] overflow-hidden">
        <div className="h-full bg-[var(--color-brand-500)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[var(--color-muted)] mt-1">{pct}% пройдено</p>
    </div>
  );
}
