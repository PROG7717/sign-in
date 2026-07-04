import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SETTINGS,
  type Project,
  type Review,
  type SiteSettings,
} from "@/lib/types";

// cache() dedupes the settings query across layouts within one request.
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
});

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as Project[] | null) ?? [];
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .limit(3);
  return (data as Project[] | null) ?? [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data as Project | null;
}

const REVIEW_WITH_PROJECT =
  "*, project:portfolio_projects(slug, title_en, title_ar)";

export async function getApprovedReviews(): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_reviews")
    .select(REVIEW_WITH_PROJECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data as Review[] | null) ?? [];
}

export async function getProjectReviews(projectId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_reviews")
    .select("*")
    .eq("status", "approved")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as Review[] | null) ?? [];
}
