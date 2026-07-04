"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { PROJECT_CATEGORIES, type Project } from "@/lib/types";
import ImageUploader from "./ImageUploader";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProjectForm({ initial }: { initial?: Project }) {
  const t = useTranslations("admin.projects.form");
  const tCat = useTranslations("categories");
  const router = useRouter();

  const [form, setForm] = useState({
    title_en: initial?.title_en ?? "",
    title_ar: initial?.title_ar ?? "",
    slug: initial?.slug ?? "",
    tagline_en: initial?.tagline_en ?? "",
    tagline_ar: initial?.tagline_ar ?? "",
    description_en: initial?.description_en ?? "",
    description_ar: initial?.description_ar ?? "",
    category: initial?.category ?? "web",
    tags: (initial?.tags ?? []).join(", "),
    year: initial?.year ? String(initial.year) : "",
    live_url: initial?.live_url ?? "",
    cover_url: initial?.cover_url ?? "",
    gallery: initial?.gallery ?? [],
    featured: initial?.featured ?? false,
    published: initial?.published ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (state !== "idle") setState("idle");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");

    const payload = {
      title_en: form.title_en.trim(),
      title_ar: form.title_ar.trim(),
      slug: slugify(form.slug || form.title_en),
      tagline_en: form.tagline_en.trim(),
      tagline_ar: form.tagline_ar.trim(),
      description_en: form.description_en.trim(),
      description_ar: form.description_ar.trim(),
      category: form.category,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      year: form.year ? Number(form.year) : null,
      live_url: form.live_url.trim() || null,
      cover_url: form.cover_url || null,
      gallery: form.gallery,
      featured: form.featured,
      published: form.published,
    };

    const supabase = createClient();
    const query = initial
      ? supabase.from("portfolio_projects").update(payload).eq("id", initial.id)
      : supabase.from("portfolio_projects").insert(payload);

    const { error } = await query;
    if (error) {
      setState("error");
      return;
    }
    setState("saved");
    router.push("/admin/projects");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/25";
  const labelClass = "mb-2 block text-sm font-medium";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Bilingual content */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{t("titleEn")}</span>
            <input
              required
              dir="ltr"
              value={form.title_en}
              onChange={(e) => {
                set("title_en", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t("titleAr")}</span>
            <input
              dir="rtl"
              value={form.title_ar}
              onChange={(e) => set("title_ar", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>{t("slug")}</span>
            <input
              required
              dir="ltr"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className={`${inputClass} font-mono text-sm`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>{t("taglineEn")}</span>
            <input
              dir="ltr"
              value={form.tagline_en}
              onChange={(e) => set("tagline_en", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t("taglineAr")}</span>
            <input
              dir="rtl"
              value={form.tagline_ar}
              onChange={(e) => set("tagline_ar", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>{t("descriptionEn")}</span>
            <textarea
              rows={7}
              dir="ltr"
              value={form.description_en}
              onChange={(e) => set("description_en", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t("descriptionAr")}</span>
            <textarea
              rows={7}
              dir="rtl"
              value={form.description_ar}
              onChange={(e) => set("description_ar", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* Meta */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>{t("category")}</span>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass}
            >
              {PROJECT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {tCat(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>{t("year")}</span>
            <input
              type="number"
              min={2000}
              max={2100}
              dir="ltr"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block lg:col-span-2">
            <span className={labelClass}>{t("liveUrl")}</span>
            <input
              type="url"
              dir="ltr"
              placeholder="https://…"
              value={form.live_url}
              onChange={(e) => set("live_url", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block sm:col-span-2 lg:col-span-4">
            <span className={labelClass}>{t("tags")}</span>
            <input
              dir="ltr"
              placeholder="Three.js, Next.js, WebGL"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* Images */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <span className={labelClass}>{t("cover")}</span>
            {form.cover_url && (
              <div className="relative mb-3 aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("cover_url", "")}
                  className="absolute top-2 end-2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-accent backdrop-blur"
                >
                  ✕ {t("remove")}
                </button>
              </div>
            )}
            <ImageUploader
              label={t("upload")}
              uploadingLabel={t("uploading")}
              onUploaded={(urls) => set("cover_url", urls[0] ?? form.cover_url)}
            />
          </div>

          <div>
            <span className={labelClass}>{t("gallery")}</span>
            {form.gallery.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2.5">
                {form.gallery.map((url, i) => (
                  <div
                    key={url + i}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "gallery",
                          form.gallery.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-1.5 end-1.5 rounded-full bg-background/80 px-2 py-0.5 text-xs text-accent backdrop-blur"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageUploader
              multiple
              label={t("upload")}
              uploadingLabel={t("uploading")}
              onUploaded={(urls) => set("gallery", [...form.gallery, ...urls])}
            />
          </div>
        </div>
      </section>

      {/* Flags + submit */}
      <section className="glass flex flex-wrap items-center justify-between gap-5 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="size-5 accent-[var(--primary)]"
            />
            <span className="text-sm font-medium">{t("featured")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="size-5 accent-[var(--secondary)]"
            />
            <span className="text-sm font-medium">{t("published")}</span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          {state === "error" && (
            <p className="text-sm font-medium text-accent">{t("error")}</p>
          )}
          {state === "saved" && (
            <p className="text-sm font-medium text-secondary">{t("saved")}</p>
          )}
          <button
            type="submit"
            disabled={state === "saving"}
            className="glow-primary rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-3.5 font-semibold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "saving" ? t("saving") : t("save")}
          </button>
        </div>
      </section>
    </form>
  );
}
