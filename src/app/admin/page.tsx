import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { getCommissionRate } from "@/lib/settings";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/lib/nav";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const [tenants, tutors, students, courses, defaultRate] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count({ where: { role: "tutor" } }),
    prisma.user.count({ where: { role: "student" } }),
    prisma.course.count(),
    getCommissionRate(),
  ]);

  const stats = [
    { label: "Репетиторов (tenants)", value: tenants },
    { label: "Преподавателей", value: tutors },
    { label: "Учеников", value: students },
    { label: "Курсов", value: courses },
  ];

  return (
    <DashboardShell title="Админ-панель" subtitle="Платформа" nav={adminNav} userName={admin.name}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm text-[var(--color-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-bold mb-2">Монетизация</h2>
        <p className="text-sm text-[var(--color-muted)] mb-3">
          Текущая комиссия платформы по умолчанию: <strong>{(defaultRate * 100).toFixed(1)}%</strong>.
          Все параметры — во вкладке Settings.
        </p>
        <Link href="/admin/settings" className="btn btn-primary">Открыть Settings</Link>
      </div>
    </DashboardShell>
  );
}
