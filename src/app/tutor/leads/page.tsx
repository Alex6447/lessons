import { prisma } from "@/lib/db";
import { requireTutor } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { tutorNav } from "@/lib/nav";
import { updateLeadStatusAction } from "@/app/actions/tutor";

const STATUSES = ["new", "contacted", "converted", "closed"] as const;
const LABEL: Record<string, string> = {
  new: "новая",
  contacted: "в работе",
  converted: "клиент",
  closed: "закрыта",
};

export default async function TutorLeadsPage() {
  const tutor = await requireTutor();
  const leads = await prisma.lead.findMany({
    where: { tenantId: tutor.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Заявки" subtitle="Обращения новых клиентов" nav={tutorNav} userName={tutor.name}>
      {leads.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-muted)]">Заявок пока нет.</div>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{l.name}</h3>
                    <span className="badge badge-gray">{LABEL[l.status] ?? l.status}</span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{l.contact}</p>
                  {l.message && <p className="text-sm mt-2">{l.message}</p>}
                </div>
                <form action={updateLeadStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="leadId" value={l.id} />
                  <select className="select" name="status" defaultValue={l.status}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{LABEL[s]}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost" type="submit">OK</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
