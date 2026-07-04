import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";
import ReviewsModeration from "@/components/admin/ReviewsModeration";

export default async function AdminReviewsPage() {
  const t = await getTranslations("admin.reviews");
  const supabase = await createClient();

  const { data } = await supabase
    .from("portfolio_reviews")
    .select("*, project:portfolio_projects(slug, title_en, title_ar)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 mb-10 text-muted">{t("subtitle")}</p>
      <ReviewsModeration initial={(data ?? []) as Review[]} />
    </div>
  );
}
