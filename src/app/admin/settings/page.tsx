import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { SETTING_DEFS, type SettingDef } from "@/lib/settings";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/lib/nav";
import { updateSettingsAction } from "@/app/actions/admin";

const GROUP_LABELS: Record<string, string> = {
  monetization: "Монетизация",
  payments: "Платежи и выплаты",
  refunds: "Возвраты",
  fiscal: "Фискализация (54-ФЗ)",
  ai: "ИИ-помощник",
  content: "Витрина / контент",
  legal: "Юридические документы",
  branding: "Брендинг",
};

const GROUP_ORDER = [
  "monetization", "payments", "refunds", "fiscal", "ai", "content", "legal", "branding",
];

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const rows = await prisma.platformSettings.findMany();
  const valueOf = (def: SettingDef) =>
    rows.find((r) => r.key === def.key)?.value ?? def.default;

  const audit = await prisma.settingsAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <DashboardShell title="Settings" subtitle="Все бизнес-параметры платформы" nav={adminNav} userName={admin.name}>
      <p className="text-sm text-[var(--color-muted)] mb-5 max-w-2xl">
        Значения хранятся в БД и применяются без релиза. Параметры, влияющие на деньги,
        фиксируются в момент платежа — изменение ставки не пересчитывает старые платежи.
      </p>

      <form action={updateSettingsAction} className="space-y-5">
        {GROUP_ORDER.map((group) => {
          const defs = SETTING_DEFS.filter((d) => d.group === group);
          if (defs.length === 0) return null;
          return (
            <section key={group} className="card p-5">
              <h2 className="font-bold mb-4">{GROUP_LABELS[group] ?? group}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {defs.map((def) => (
                  <Field key={def.key} def={def} value={valueOf(def)} />
                ))}
              </div>
            </section>
          );
        })}

        <div className="sticky bottom-4">
          <button className="btn btn-primary shadow-lg" type="submit">Сохранить настройки</button>
        </div>
      </form>

      {audit.length > 0 && (
        <section className="card p-5 mt-6">
          <h2 className="font-bold mb-3">Журнал изменений</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                <th className="py-1">Когда</th>
                <th>Параметр</th>
                <th>Было → стало</th>
                <th>Кто</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-border)]">
                  <td className="py-1">{a.createdAt.toLocaleString("ru-RU")}</td>
                  <td className="font-mono text-xs">{a.key}</td>
                  <td>{a.oldValue} → {a.newValue}</td>
                  <td>{a.changedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </DashboardShell>
  );
}

function Field({ def, value }: { def: SettingDef; value: string }) {
  if (def.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={def.key} defaultChecked={value === "true"} className="w-4 h-4" />
        <span>{def.label}</span>
      </label>
    );
  }
  return (
    <div>
      <label className="label" htmlFor={def.key}>{def.label}</label>
      <input
        className="input"
        id={def.key}
        name={def.key}
        type={def.type === "number" ? "number" : "text"}
        step="any"
        defaultValue={value}
      />
      <p className="text-[0.7rem] text-[var(--color-muted)] mt-1 font-mono">{def.key}</p>
    </div>
  );
}
