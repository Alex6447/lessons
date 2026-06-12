import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTutor } from "@/lib/guard";
import { DashboardShell } from "@/components/DashboardShell";
import { tutorNav, rub } from "@/lib/nav";
import { createCourseAction } from "@/app/actions/tutor";

export default async function TutorCoursesPage() {
  const tutor = await requireTutor();
  const courses = await prisma.course.findMany({
    where: { tenantId: tutor.tenantId },
    include: { _count: { select: { modules: true, enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Курсы" nav={tutorNav} userName={tutor.name}>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* list */}
        <div className="space-y-3">
          {courses.length === 0 && (
            <div className="card p-8 text-center text-[var(--color-muted)]">
              Курсов пока нет. Создайте первый справа →
            </div>
          )}
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/tutor/courses/${c.id}`}
              className="card p-5 flex items-center justify-between hover:border-[var(--color-brand-300)] transition"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{c.title}</h3>
                  <span className={`badge ${c.status === "published" ? "badge-green" : "badge-amber"}`}>
                    {c.status === "published" ? "опубликован" : "черновик"}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  {c._count.modules} модулей · {c._count.enrollments} учеников · {rub(c.priceKopecks)}
                </p>
              </div>
              <span className="text-[var(--color-brand-600)]">→</span>
            </Link>
          ))}
        </div>

        {/* create form */}
        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-4">Новый курс</h2>
          <form action={createCourseAction} className="space-y-3">
            <div>
              <label className="label">Название</label>
              <input className="input" name="title" required placeholder="Подготовка к ЕГЭ" />
            </div>
            <div>
              <label className="label">Предмет</label>
              <input className="input" name="subject" placeholder="Математика" />
            </div>
            <div>
              <label className="label">Цель ученика</label>
              <textarea className="textarea" name="goal" rows={2} placeholder="Сдать ЕГЭ на 80+" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Уровень</label>
                <input className="input" name="level" placeholder="11 класс" />
              </div>
              <div>
                <label className="label">Возраст</label>
                <input className="input" name="ageGroup" placeholder="16–17" />
              </div>
            </div>
            <div>
              <label className="label">Цена, ₽</label>
              <input className="input" name="priceRub" type="number" min={0} defaultValue={0} />
            </div>
            <button className="btn btn-primary w-full" type="submit">Создать</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
