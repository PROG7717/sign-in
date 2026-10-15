"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Review, ReviewStatus } from "@/lib/types";
import { localized } from "@/lib/types";
import StarRating from "@/components/reviews/StarRating";

type Tab = ReviewStatus | "all";

export default function ReviewsModeration({ initial }: { initial: Review[] }) {
  const t = useTranslations("admin.reviews");
  const locale = useLocale();
  const router = useRouter();
  const [reviews, setReviews] = useState(initial);
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byStatus = { pending: 0, approved: 0, hidden: 0 };
    for (const review of reviews) byStatus[review.status]++;
    return { ...byStatus, all: reviews.length };
  }, [reviews]);

  const visible =
    tab === "all" ? reviews : reviews.filter((review) => review.status === tab);

  async function setStatus(review: Review, status: ReviewStatus) {
    setBusyId(review.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("portfolio_reviews")
      .update({ status })
      .eq("id", review.id);
    if (!error) {
      setReviews((list) =>
        list.map((r) => (r.id === review.id ? { ...r, status } : r)),
      );
      router.refresh();
    }
    setBusyId(null);
  }

  async function remove(review: Review) {
    if (!window.confirm(t("confirmDelete"))) return;
    setBusyId(review.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("portfolio_reviews")
      .delete()
      .eq("id", review.id);
    if (!error) {
      setReviews((list) => list.filter((r) => r.id !== review.id));
      router.refresh();
    }
    setBusyId(null);
  }

  const tabs: Tab[] = ["pending", "approved", "hidden", "all"];

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === value
                ? "bg-gradient-to-r from-primary to-secondary text-white"
                : "glass text-muted hover:text-foreground"
            }`}
          >
            {t(`tabs.${value}`)}
            <span className="ms-2 rounded-full bg-white/15 px-2 py-0.5 text-xs">
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="glass rounded-3xl p-12 text-center text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((review) => (
            <li
              key={review.id}
              className={`glass rounded-2xl p-5 transition-opacity ${
                busyId === review.id ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold">{review.author_name}</span>
                    {review.author_role && (
                      <span className="text-sm text-muted">{review.author_role}</span>
                    )}
                    <StarRating rating={review.rating} size={14} />
                    <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                      {review.project
                        ? `${t("forProject")}: ${localized(review.project, "title", locale)}`
                        : t("general")}
                    </span>
                  </div>
                  <p className="mt-2.5 leading-relaxed text-foreground/85" dir="auto">
                    {review.comment}
                  </p>
                  <p className="mt-2 text-xs text-muted" dir="ltr">
                    {new Date(review.created_at).toLocaleString(
                      locale === "ar" ? "ar" : "en",
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {review.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => setStatus(review, "approved")}
                      className="rounded-full bg-secondary/15 px-4 py-2 text-sm font-semibold text-secondary ring-1 ring-secondary/40 transition-colors hover:bg-secondary/25"
                    >
                      ✓ {t("approve")}
                    </button>
                  )}
                  {review.status !== "hidden" && (
                    <button
                      type="button"
                      onClick={() => setStatus(review, "hidden")}
                      className="glass rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
                    >
                      {t("hide")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(review)}
                    className="rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
