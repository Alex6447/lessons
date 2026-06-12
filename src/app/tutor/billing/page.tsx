import { prisma } from "@/lib/db";
import { requireTutor } from "@/lib/guard";
import { getCommissionRate } from "@/lib/settings";
import { DashboardShell } from "@/components/DashboardShell";
import { tutorNav, rub } from "@/lib/nav";

export default async function TutorBillingPage() {
  const tutor = await requireTutor();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tutor.tenantId },
    include: { plan: true, subscription: true },
  });

  const commission = await getCommissionRate(tenant ?? undefined);
  const payments = await prisma.payment.findMany({
    where: { tenantId: tutor.tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <DashboardShell title="Оплата" subtitle="Подписка и комиссия" nav={tutorNav} userName={tutor.name}>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h2 className="font-bold mb-3">Ваша подписка</h2>
          <p className="text-sm mb-1">
            Тариф: <strong>{tenant?.plan?.name ?? "—"}</strong>
          </p>
          <p className="text-sm mb-1">
            Стоимость: <strong>{tenant?.plan ? rub(tenant.plan.priceKopecks) : "—"}/мес</strong>
          </p>
          <p className="text-sm mb-3">
            Статус: <span className="badge badge-green">{tenant?.subscription?.status ?? "—"}</span>
          </p>
          <button className="btn btn-ghost" disabled title="Подключение ЮKassa — Этап 2">
            Управлять подпиской (скоро)
          </button>
        </div>

        <div className="card p-5">
          <h2 className="font-bold mb-3">Комиссия с оплат учеников</h2>
          <div className="text-3xl font-extrabold mb-1">{(commission * 100).toFixed(1)}%</div>
          <p className="text-sm text-[var(--color-muted)]">
            Применяется к каждой оплате ученика. Ставку настраивает администратор платформы
            (Settings → Монетизация); на платном тарифе может быть ниже.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold mb-3">Платежи учеников</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Платежей пока нет. Приём оплат со сплитом подключается на Этапе 2 (ЮKassa).
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                <th className="py-2">Дата</th>
                <th>Сумма</th>
                <th>Комиссия</th>
                <th>Репетитору</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2">{p.createdAt.toLocaleDateString("ru-RU")}</td>
                  <td>{rub(p.amountKopecks)}</td>
                  <td>{rub(p.commissionKopecks)}</td>
                  <td>{rub(p.tutorShareKopecks)}</td>
                  <td><span className="badge badge-gray">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
