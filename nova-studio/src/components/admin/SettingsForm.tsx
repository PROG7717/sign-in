"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyTheme } from "@/lib/theme";
import { DEFAULT_SETTINGS, safeColor, type SiteSettings } from "@/lib/types";

type ColorKey = "primary_color" | "secondary_color" | "accent_color";

const colorFields: { key: ColorKey; themeKey: "primary" | "secondary" | "accent"; labelKey: "primary" | "secondary" | "accent" }[] = [
  { key: "primary_color", themeKey: "primary", labelKey: "primary" },
  { key: "secondary_color", themeKey: "secondary", labelKey: "secondary" },
  { key: "accent_color", themeKey: "accent", labelKey: "accent" },
];

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const t = useTranslations("admin.settings");
  const router = useRouter();

  const [form, setForm] = useState({
    primary_color: initial.primary_color,
    secondary_color: initial.secondary_color,
    accent_color: initial.accent_color,
    site_name_en: initial.site_name_en,
    site_name_ar: initial.site_name_ar,
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function setColor(key: ColorKey, themeKey: "primary" | "secondary" | "accent", value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setState("idle");
    // Instant live preview on this page (and 3D scene) via CSS variables
    applyTheme({ [themeKey]: safeColor(value, DEFAULT_SETTINGS[key]) });
  }

  function reset() {
    setForm((f) => ({
      ...f,
      primary_color: DEFAULT_SETTINGS.primary_color,
      secondary_color: DEFAULT_SETTINGS.secondary_color,
      accent_color: DEFAULT_SETTINGS.accent_color,
    }));
    applyTheme({
      primary: DEFAULT_SETTINGS.primary_color,
      secondary: DEFAULT_SETTINGS.secondary_color,
      accent: DEFAULT_SETTINGS.accent_color,
    });
    setState("idle");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");

    const supabase = createClient();
    const { error } = await supabase
      .from("portfolio_settings")
      .update({
        primary_color: safeColor(form.primary_color, DEFAULT_SETTINGS.primary_color),
        secondary_color: safeColor(form.secondary_color, DEFAULT_SETTINGS.secondary_color),
        accent_color: safeColor(form.accent_color, DEFAULT_SETTINGS.accent_color),
        site_name_en: form.site_name_en.trim() || DEFAULT_SETTINGS.site_name_en,
        site_name_ar: form.site_name_ar.trim() || DEFAULT_SETTINGS.site_name_ar,
      })
      .eq("id", 1);

    if (error) {
      setState("error");
      return;
    }
    setState("saved");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/25";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Colors */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-bold">{t("colors")}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {colorFields.map((field) => (
            <div key={field.key}>
              <span className="mb-2 block text-sm font-medium">
                {t(field.labelKey)}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={safeColor(form[field.key], DEFAULT_SETTINGS[field.key])}
                  onChange={(e) => setColor(field.key, field.themeKey, e.target.value)}
                  className="size-12 shrink-0 rounded-xl"
                  aria-label={t(field.labelKey)}
                />
                <input
                  value={form[field.key]}
                  onChange={(e) => setColor(field.key, field.themeKey, e.target.value)}
                  dir="ltr"
                  className={`${inputClass} font-mono text-sm`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Live preview strip */}
        <div className="mt-8 rounded-2xl border border-line p-5">
          <p className="mb-4 text-sm font-medium text-muted">{t("preview")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="glow-primary rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-semibold text-white">
              Aa — {t("primary")} → {t("secondary")}
            </span>
            <span className="rounded-full bg-accent/15 px-6 py-3 text-sm font-semibold text-accent ring-1 ring-accent/40">
              {t("accent")}
            </span>
            <span className="text-2xl font-bold text-gradient">Gradient ✦</span>
          </div>
          <p className="mt-4 text-xs text-muted">{t("previewHint")}</p>
        </div>
      </section>

      {/* Site name */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-bold">{t("siteName")}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">{t("siteNameEn")}</span>
            <input
              dir="ltr"
              value={form.site_name_en}
              onChange={(e) => {
                setForm((f) => ({ ...f, site_name_en: e.target.value }));
                setState("idle");
              }}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">{t("siteNameAr")}</span>
            <input
              dir="rtl"
              value={form.site_name_ar}
              onChange={(e) => {
                setForm((f) => ({ ...f, site_name_ar: e.target.value }));
                setState("idle");
              }}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "saving"}
          className="glow-primary rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-3.5 font-semibold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "saving" ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="glass rounded-full px-6 py-3.5 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          {t("reset")}
        </button>
        {state === "saved" && (
          <p className="text-sm font-medium text-secondary">{t("saved")}</p>
        )}
        {state === "error" && (
          <p className="text-sm font-medium text-accent">{t("error")}</p>
        )}
      </div>
    </form>
  );
}
