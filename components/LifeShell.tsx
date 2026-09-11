"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export const fieldClass =
  "w-full rounded-xl border border-primary/25 bg-white p-3 text-base text-text";
export const buttonClass =
  "rounded-xl bg-primary px-5 py-3 text-white disabled:opacity-50";
export default function LifeShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/room" className="text-primary">
          ← Mori Room
        </Link>
        <header className="my-8">
          <h1 className="text-4xl font-serif">{title}</h1>
          <p className="mt-3 max-w-3xl text-lg text-text/70">{description}</p>
        </header>
        <nav
          aria-label="Family workspace"
          className="mb-8 flex flex-wrap gap-2"
        >
          {[
            ["profile", "Profile"],
            ["people", "People"],
            ["library", "Memories"],
            ["albums", "Albums"],
            ["life-map", "Life Map"],
            ["sessions", "Sessions"],
            ["family", "Family"],
            ["stories", "Stories"],
            ["insights", "Insights"],
            ["settings", "Settings"],
            ["care", "Session plans"],
          ].map(([path, label]) => (
            <Link
              key={path}
              href={`/room/${path}`}
              aria-current={pathname === `/room/${path}` ? "page" : undefined}
              className={`rounded-full border px-4 py-2 ${pathname === `/room/${path}` ? "bg-primary text-white" : "border-primary/20"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </main>
  );
}
