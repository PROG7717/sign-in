"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";

const navItems = [
  { href: "/admin", key: "overview", exact: true },
  { href: "/admin/projects", key: "projects", exact: false },
  { href: "/admin/reviews", key: "reviews", exact: false },
  { href: "/admin/settings", key: "settings", exact: false },
] as const;

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-svh">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col justify-between border-e border-line bg-surface/60 p-5 backdrop-blur lg:flex">
        <div>
          <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-2">
            <span className="glow-primary inline-block size-3 rounded-full bg-gradient-to-tr from-primary to-secondary" />
            <span className="font-bold">Admin</span>
          </Link>
          {nav}
        </div>

        <div className="space-y-3">
          <p className="truncate px-2 text-xs text-muted" dir="ltr">
            {email}
          </p>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Link
              href="/"
              className="glass flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors hover:text-primary"
            >
              {t("viewSite")}
            </Link>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full rounded-full border border-accent/40 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            {t("signOut")}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-line bg-surface/80 px-5 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-gradient-to-tr from-primary to-secondary" />
          <span className="font-bold">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="glass rounded-full px-4 py-2 text-sm font-medium"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 border-b border-line bg-surface p-4 lg:hidden">
          {nav}
          <div className="mt-3 flex items-center gap-2">
            <LocaleSwitcher />
            <Link href="/" className="glass flex-1 rounded-full px-4 py-2 text-center text-sm">
              {t("viewSite")}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-accent/40 px-4 py-2 text-sm text-accent"
            >
              {t("signOut")}
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-5 pt-20 pb-16 sm:px-8 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
