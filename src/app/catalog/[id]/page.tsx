import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { rub } from "@/lib/nav";
import { LeadForm } from "./LeadForm";

export default async function CatalogCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await prisma.course.findFirst({
    where: { id, status: "published", isDemo: true },
    include: {
      tutor: { include: { tutorProfile: true } },
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" }, select: { id: true, title: true } } },
      },
    },
  });
  if (!course) notFound();

  const profile = course.tutor.tutorProfile;

  return (
    <main>
      <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Link href="/" className="font-extrabold text-lg">
          Lessons<span className="text-[var(--color-brand-600)]">.</span>
        </Link>
        <Link href="/catalog" className="text-sm text-[var(--color-muted)]">← Витрина</Link>
      </header>

      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto grid lg:grid-cols-[1fr_340px] gap-8">
        <div>
          <span className="badge badge-gray mb-3">{course.subject || "Курс"}</span>
          <h1 className="text-3xl font-extrabold mb-2">{course.title}</h1>
          <p className="text-[var(--color-muted)] mb-4">{course.goal}</p>
          <div className="flex flex-wrap gap-2 mb-6 text-sm">
            {course.level && <span className="badge badge-brand">Уровень: {course.level}</span>}
            {course.ageGroup && <span className="badge badge-brand">Возраст: {course.ageGroup}</span>}
            <span className="badge badge-green">
              {course.priceKopecks > 0 ? rub(course.priceKopecks) : "Бесплатно"}
            </span>
          </div>

          <h2 className="font-bold mb-3">Программа курса</h2>
          <div className="space-y-3">
            {course.modules.map((m) => (
              <div key={m.id} className="card p-4">
                <h3 className="font-semibold mb-2">Модуль {m.order}. {m.title}</h3>
                <ul className="text-sm text-[var(--color-muted)] space-y-1 pl-4 list-disc">
                  {m.lessons.map((l) => (
                    <li key={l.id}>{l.title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold mb-1">{course.tutor.name}</h3>
            {profile?.headline && <p className="text-sm text-[var(--color-muted)] mb-2">{profile.headline}</p>}
            {profile?.bio && <p className="text-sm">{profile.bio}</p>}
            {profile?.subjects && (
              <div className="flex flex-wrap gap-1 mt-3">
                {profile.subjects.split(",").filter(Boolean).map((s) => (
                  <span key={s} className="badge badge-gray">{s.trim()}</span>
                ))}
              </div>
            )}
          </div>
          <LeadForm courseId={course.id} />
        </aside>
      </div>
    </main>
  );
}
