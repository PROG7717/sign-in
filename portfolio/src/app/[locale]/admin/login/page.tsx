"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"invalid" | "notAdmin" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.user) {
      setError("invalid");
      setSubmitting(false);
      return;
    }

    // Only accounts present in portfolio_admins may enter the dashboard
    const { data: adminRow } = await supabase
      .from("portfolio_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      setError("notAdmin");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/25";

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-5">
      <div className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_60%)]" />

      <div className="absolute top-6 end-6">
        <LocaleSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="glass w-full max-w-md rounded-3xl p-8 sm:p-10"
      >
        <span className="glow-primary mb-6 inline-block size-3 rounded-full bg-gradient-to-tr from-primary to-secondary" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 mb-8 text-muted">{t("subtitle")}</p>

        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">{t("email")}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">{t("password")}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </label>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent ring-1 ring-accent/30"
            >
              {t(error)}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="glow-primary w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-3.5 font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-muted transition-colors hover:text-primary"
        >
          ← {t("backToSite")}
        </Link>
      </motion.div>
    </div>
  );
}
