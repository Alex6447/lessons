import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav, rub } from "@/lib/nav";
import { upsertPlanAction } from "@/app/actions/admin";

export default async function AdminPlansPage() {
  const admin = await requireAdmin();
  const plans = await prisma.plan.findMany({
    include: { _count: { select: { tenants: true } } },
    orderBy: { priceKopecks: "asc" },
  });

  return (
    <DashboardShell title="Тарифы" subtitle="Планы абонплаты" nav={adminNav} userName={admin.name}>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-3">
          {plans.map((p) => (
            <details key={p.id} className="card p-5">
              <summary className="cursor-pointer flex items-center justify-between">
                <div>
                  <span className="font-bold">{p.name}</span>{" "}
                  <span className="text-sm text-[var(--color-muted)]">
                    · {rub(p.priceKopecks)}/мес · {p._count.tenants} активных
                  </span>
                </div>
                {!p.active && <span className="badge badge-gray">выключен</span>}
              </summary>
              <form action={upsertPlanAction} className="mt-4 grid sm:grid-cols-2 gap-3">
                <input type="hidden" name="id" value={p.id} />
                <FormFields plan={p} />
                <div className="sm:col-span-2">
                  <button className="btn btn-primary" type="submit">Сохранить</button>
                </div>
              </form>
            </details>
          ))}
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-4">Новый тариф</h2>
          <form action={upsertPlanAction} className="space-y-3">
            <FormFields />
            <button className="btn btn-primary w-full" type="submit">Создать</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}

function FormFields({
  plan,
}: {
  plan?: {
    name: string;
    priceKopecks: number;
    maxStudents: number;
    maxCourses: number;
    storageMb: number;
    commissionRateOverride: number | null;
    active: boolean;
  };
}) {
  return (
    <>
      <div>
        <label className="label">Название</label>
        <input className="input" name="name" defaultValue={plan?.name ?? ""} required />
      </div>
      <div>
        <label className="label">Цена, ₽/мес</label>
        <input className="input" name="priceRub" type="number" min={0} defaultValue={plan ? plan.priceKopecks / 100 : 0} />
      </div>
      <div>
        <label className="label">Лимит учеников (0 = ∞)</label>
        <input className="input" name="maxStudents" type="number" min={0} defaultValue={plan?.maxStudents ?? 0} />
      </div>
      <div>
        <label className="label">Лимит курсов (0 = ∞)</label>
        <input className="input" name="maxCourses" type="number" min={0} defaultValue={plan?.maxCourses ?? 0} />
      </div>
      <div>
        <label className="label">Хранилище, МБ</label>
        <input className="input" name="storageMb" type="number" min={0} defaultValue={plan?.storageMb ?? 0} />
      </div>
      <div>
        <label className="label">Комиссия для тарифа, % (пусто = по умолчанию)</label>
        <input className="input" name="commissionPct" type="number" step="any" min={0} defaultValue={plan?.commissionRateOverride != null ? plan.commissionRateOverride * 100 : ""} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} className="w-4 h-4" />
        <span>Тариф активен</span>
      </label>
    </>
  );
}
