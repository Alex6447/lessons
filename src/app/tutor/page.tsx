import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTutor } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { tutorNav } from "@/lib/nav";

export default async function TutorDashboard() {
  const tutor = await requireTutor();
  const tenantId = tutor.tenantId;

  const [courses, published, students, newLeads] = await Promise.all([
    prisma.course.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId, status: "published" } }),
    prisma.user.count({ where: { tenantId, role: "student" } }),
    prisma.lead.count({ where: { tenantId, status: "new" } }),
  ]);

  const recentLeads = await prisma.lead.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "Курсов", value: courses, href: "/tutor/courses" },
    { label: "Опубликовано", value: published, href: "/tutor/courses" },
    { label: "Учеников", value: students, href: "/tutor/students" },
    { label: "Новых заявок", value: newLeads, href: "/tutor/leads" },
  ];

  return (
    <DashboardShell title="Обзор" subtitle={tutor.name} nav={tutorNav} userName={tutor.name}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:border-[var(--color-brand-300)] transition">
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm text-[var(--color-muted)]">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Последние заявки</h2>
            <Link href="/tutor/leads" className="text-sm text-[var(--color-brand-600)]">Все</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Заявок пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span>{l.name} · <span className="text-[var(--color-muted)]">{l.contact}</span></span>
                  <span className="badge badge-gray">{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold mb-3">Быстрые действия</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/tutor/courses" className="btn btn-primary">Создать курс</Link>
            <Link href="/tutor/students" className="btn btn-ghost">Добавить ученика</Link>
            <Link href="/tutor/billing" className="btn btn-ghost">Подписка и оплата</Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
