"use client";

import { useEffect, useState } from "react";

// Toggles the `dark` class on <html> and persists the choice in localStorage.
// The initial class is set by an inline script in layout.tsx (no flash).
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className="grid place-items-center w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-base hover:border-[var(--color-brand-300)]"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
