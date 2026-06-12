import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lessons — платформа для репетиторов",
  description:
    "Платформа для репетиторов: личные кабинеты, курсы с ИИ-помощником, оплата и витрина демо-материалов.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
