import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getApprovedReviews, getProjects } from "@/lib/data";
import { localized } from "@/lib/types";
import SectionHeader from "@/components/home/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReviewForm from "@/components/reviews/ReviewForm";
import StarRating from "@/components/reviews/StarRating";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reviews");
  return { title: t("title") };
}

export default async function ReviewsPage() {
  const locale = await getLocale();
  const [t, reviews, projects] = await Promise.all([
    getTranslations("reviews"),
    getApprovedReviews(),
    getProjects(),
  ]);

  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    amount: reviews.filter((r) => r.rating === stars).length,
  }));

  const projectOptions = projects.map((project) => ({
    id: project.id,
    title: localized(project, "title", locale),
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 pt-36 pb-24 sm:px-8">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        {/* Summary + form column */}
        <div className="space-y-6 lg:sticky lg:top-28">
          {count > 0 && (
            <Reveal>
              <div className="glass rounded-3xl p-7">
                <div className="flex items-center gap-5">
                  <span className="text-6xl font-bold text-gradient">{avg.toFixed(1)}</span>
                  <span>
                    <StarRating rating={avg} size={20} />
                    <span className="mt-1.5 block text-sm text-muted">
                      {t("summary.total", { count })}
                    </span>
                  </span>
                </div>
                <div className="mt-6 space-y-2.5">
                  {distribution.map(({ stars, amount }) => (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-8 shrink-0 text-muted" dir="ltr">
                        {stars}★
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-700"
                          style={{ width: count ? `${(amount / count) * 100}%` : "0%" }}
                        />
                      </span>
                      <span className="w-6 shrink-0 text-end text-muted">{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            <ReviewForm projects={projectOptions} />
          </Reveal>
        </div>

        {/* Review wall */}
        <div>
          {count === 0 ? (
            <p className="glass rounded-3xl p-12 text-center text-muted">{t("empty")}</p>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {reviews.map((review, i) => (
                <Reveal key={review.id} delay={(i % 2) * 0.08}>
                  <ReviewCard
                    review={review}
                    locale={locale}
                    generalLabel={t("generalWork")}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
