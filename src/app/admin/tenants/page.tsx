import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/lib/nav";

export default async function AdminTenantsPage() {
  const admin = await requireAdmin();
  const tenants = await prisma.tenant.findMany({
    include: {
      plan: true,
      subscription: true,
      _count: { select: { users: true, courses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Репетиторы" subtitle="Все рабочие пространства (tenants)" nav={adminNav} userName={admin.name}>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
              <th className="p-4">Кабинет</th>
              <th>Тариф</th>
              <th>Подписка</th>
              <th>Пользователей</th>
              <th>Курсов</th>
              <th>Создан</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-[var(--color-border)]">
                <td className="p-4">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-[var(--color-muted)] font-mono">/{t.slug}</div>
                </td>
                <td>{t.plan?.name ?? "—"}</td>
                <td><span className="badge badge-gray">{t.subscription?.status ?? "—"}</span></td>
                <td>{t._count.users}</td>
                <td>{t._count.courses}</td>
                <td>{t.createdAt.toLocaleDateString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
