import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

export type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  subtitle,
  nav,
  userName,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-surface)] md:min-h-screen p-4 flex md:flex-col gap-1 md:gap-1 items-center md:items-stretch overflow-x-auto">
        <Link href="/" className="font-extrabold text-lg px-2 py-2 mr-2 md:mr-0 md:mb-4 whitespace-nowrap">
          Lessons<span className="text-[var(--color-brand-600)]">.</span>
        </Link>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div>
            <h1 className="font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)] hidden sm:inline">{userName}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
