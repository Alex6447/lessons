import Link from "next/link";
import { prisma } from "@/lib/db";
import { rub } from "@/lib/nav";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const where = {
    status: "published",
    isDemo: true,
    ...(sp.subject ? { subject: sp.subject } : {}),
    ...(sp.q ? { title: { contains: sp.q } } : {}),
  };

  const [courses, subjectsRaw] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { tutor: { include: { tutorProfile: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { status: "published", isDemo: true },
      select: { subject: true },
      distinct: ["subject"],
    }),
  ]);
  const subjects = subjectsRaw.map((s) => s.subject).filter(Boolean);

  return (
    <main>
      <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Link href="/" className="font-extrabold text-lg">
          Lessons<span className="text-[var(--color-brand-600)]">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost">Войти</Link>
        </div>
      </header>

      <section className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2">Витрина курсов</h1>
        <p className="text-[var(--color-muted)] mb-6">
          Демо-материалы преподавателей. Найдите репетитора по предмету и оставьте заявку.
        </p>

        {/* Filters */}
        <form className="flex flex-wrap gap-2 mb-6">
          <input className="input max-w-xs" name="q" placeholder="Поиск по названию" defaultValue={sp.q ?? ""} />
          <select className="select max-w-xs" name="subject" defaultValue={sp.subject ?? ""}>
            <option value="">Все предметы</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">Найти</button>
        </form>

        {courses.length === 0 ? (
          <div className="card p-10 text-center text-[var(--color-muted)]">
            Ничего не найдено.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link key={c.id} href={`/catalog/${c.id}`} className="card p-5 hover:border-[var(--color-brand-300)] transition flex flex-col">
                <span className="badge badge-gray mb-2 w-fit">{c.subject || "Курс"}</span>
                <h3 className="font-bold mb-1">{c.title}</h3>
                <p className="text-sm text-[var(--color-muted)] mb-3 line-clamp-2 flex-1">{c.goal}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{c.tutor.name}</span>
                  <span className="font-semibold">{c.priceKopecks > 0 ? rub(c.priceKopecks) : "Бесплатно"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
