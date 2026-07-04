import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";
import StarRating from "@/components/reviews/StarRating";

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin.overview");
  const supabase = await createClient();

  const [total, published, pending, approved, recent] = await Promise.all([
    supabase.from("portfolio_projects").select("*", { count: "exact", head: true }),
    supabase
      .from("portfolio_projects")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabase
      .from("portfolio_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("portfolio_reviews").select("rating").eq("status", "approved"),
    supabase
      .from("portfolio_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const ratings = (approved.data ?? []) as { rating: number }[];
  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;

  const stats = [
    { label: t("totalProjects"), value: String(total.count ?? 0) },
    { label: t("publishedProjects"), value: String(published.count ?? 0) },
    { label: t("pendingReviews"), value: String(pending.count ?? 0), alert: (pending.count ?? 0) > 0 },
    { label: t("averageRating"), value: avg ? `${avg.toFixed(1)}★` : "—" },
  ];

  const recentReviews = (recent.data ?? []) as Review[];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 mb-10 text-muted">{t("subtitle")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`glass rounded-2xl p-5 ${stat.alert ? "ring-1 ring-accent/50" : ""}`}
          >
            <p className="text-3xl font-bold text-gradient">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="glass rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("recentReviews")}</h2>
            <Link
              href="/admin/reviews"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("moderate")} →
            </Link>
          </div>
          <ul className="space-y-4">
            {recentReviews.map((review) => (
              <li key={review.id} className="flex items-start justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {review.author_name}
                    <span
                      className={`ms-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        review.status === "approved"
                          ? "bg-secondary/15 text-secondary"
                          : review.status === "pending"
                            ? "bg-accent/15 text-accent"
                            : "bg-white/10 text-muted"
                      }`}
                    >
                      {review.status}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted" dir="auto">
                    {review.comment}
                  </p>
                </div>
                <StarRating rating={review.rating} size={13} className="shrink-0" />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass h-fit rounded-3xl p-6">
          <h2 className="mb-4 text-lg font-bold">{t("quickActions")}</h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/admin/projects/new"
              className="rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-center text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              + {t("newProject")}
            </Link>
            <Link
              href="/admin/settings"
              className="glass rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors hover:text-primary"
            >
              🎨 {t("editTheme")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
