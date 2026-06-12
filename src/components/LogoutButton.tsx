import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]">
        Выйти
      </button>
    </form>
  );
}
