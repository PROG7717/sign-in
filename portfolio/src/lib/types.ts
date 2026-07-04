export type Project = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  tagline_en: string;
  tagline_ar: string;
  description_en: string;
  description_ar: string;
  category: string;
  tags: string[];
  cover_url: string | null;
  gallery: string[];
  live_url: string | null;
  year: number | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReviewStatus = "pending" | "approved" | "hidden";

export type Review = {
  id: string;
  project_id: string | null;
  author_name: string;
  author_role: string;
  rating: number;
  comment: string;
  locale: "en" | "ar";
  status: ReviewStatus;
  created_at: string;
  /** Embedded relation when queried with a join */
  project?: Pick<Project, "slug" | "title_en" | "title_ar"> | null;
};

export type SiteSettings = {
  id: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  site_name_en: string;
  site_name_ar: string;
  updated_at: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  primary_color: "#8b5cf6",
  secondary_color: "#22d3ee",
  accent_color: "#fb7185",
  site_name_en: "NOVA Studio",
  site_name_ar: "استوديو نوفا",
  updated_at: "",
};

export const PROJECT_CATEGORIES = ["web", "mobile", "branding"] as const;

/** Pick the localized variant of a bilingual column, falling back to English. */
export function localized<
  T extends Record<string, unknown>,
  K extends string,
>(row: T, key: K, locale: string): string {
  const ar = row[`${key}_ar`] as string | undefined;
  const en = row[`${key}_en`] as string | undefined;
  return (locale === "ar" && ar?.trim() ? ar : en) ?? "";
}

/** Guard against CSS injection when echoing stored colors into a <style> tag. */
export function safeColor(value: string, fallback: string): string {
  return /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
    ? value
    : fallback;
}
