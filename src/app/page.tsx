import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { homeFor } from "@/lib/guard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LandingPage() {
  const session = await getSession();
  const demoCourses = await prisma.course.findMany({
    where: { status: "published", isDemo: true },
    include: { tutor: { include: { tutorProfile: true } } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="font-extrabold text-lg">
          Lessons<span className="text-[var(--color-brand-600)]">.</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/catalog" className="text-sm font-medium text-[var(--color-muted)]">
            Витрина
          </Link>
          <ThemeToggle />
          {session ? (
            <Link href={homeFor(session)} className="btn btn-primary">
              В кабинет
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Войти</Link>
              <Link href="/register" className="btn btn-primary">Я репетитор</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 py-16 md:py-24 max-w-5xl mx-auto text-center">
        <span className="badge badge-brand mb-5">Платформа для репетиторов</span>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
          Личные кабинеты, курсы с ИИ-помощником и оплата —{" "}
          <span className="text-[var(--color-brand-600)]">в одном месте</span>
        </h1>
        <p className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto mb-8">
          Ведите учеников, собирайте индивидуальные курсы, принимайте оплату и
          показывайте демо-материалы новым клиентам. Без зоопарка сервисов.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="btn btn-primary">Создать кабинет</Link>
          <Link href="/catalog" className="btn btn-ghost">Смотреть витрину</Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-6 md:px-10 pb-16 max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ["Кабинеты учеников", "Доступ к материалам, прогресс, задания — у каждого ученика своё пространство."],
          ["Конструктор курсов", "Модули → уроки → задания. Скоро — генерация структуры с ИИ."],
          ["Оплата и подписка", "Абонплата за кабинет и приём оплат от учеников с настраиваемой комиссией."],
          ["Витрина", "Новые ученики находят вас по предмету, возрасту и уровню."],
          ["Заявки", "Обращения новых клиентов собираются в одном списке."],
          ["Общение", "Видеоуроки и сообщения с учениками (на подключении)."],
        ].map(([title, desc]) => (
          <div key={title} className="card p-5">
            <h3 className="font-bold mb-1">{title}</h3>
            <p className="text-sm text-[var(--color-muted)]">{desc}</p>
          </div>
        ))}
      </section>

      {/* Demo catalog preview */}
      {demoCourses.length > 0 && (
        <section className="px-6 md:px-10 pb-20 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Демо-материалы преподавателей</h2>
            <Link href="/catalog" className="text-sm font-semibold text-[var(--color-brand-600)]">
              Вся витрина →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoCourses.map((c) => (
              <Link key={c.id} href={`/catalog/${c.id}`} className="card p-5 hover:border-[var(--color-brand-300)] transition">
                <span className="badge badge-gray mb-2">{c.subject || "Курс"}</span>
                <h3 className="font-bold mb-1">{c.title}</h3>
                <p className="text-sm text-[var(--color-muted)] mb-3 line-clamp-2">{c.goal}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {c.tutor.name} · {c.level || "—"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 md:px-10 py-8 text-sm text-[var(--color-muted)] text-center">
        Lessons — MVP. Сделано по плану из docs_lessons/proposal.md.
      </footer>
    </main>
  );
}
