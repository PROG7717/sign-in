import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Review } from "@/lib/types";
import Reveal from "@/components/motion/Reveal";
import ReviewCard from "@/components/reviews/ReviewCard";
import StarRating from "@/components/reviews/StarRating";
import SectionHeader from "./SectionHeader";

export default async function ReviewsStrip({ reviews }: { reviews: Review[] }) {
  const locale = await getLocale();
  const t = await getTranslations("reviewsSection");
  const tReviews = await getTranslations("reviews");

  if (reviews.length === 0) return null;

  const avg =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
          <Reveal className="mb-12">
            <div className="glass flex items-center gap-4 rounded-2xl px-6 py-4">
              <span className="text-4xl font-bold text-gradient">{avg.toFixed(1)}</span>
              <span>
                <StarRating rating={avg} />
                <span className="mt-1 block text-xs text-muted">
                  {t("basedOn", { count: reviews.length })}
                </span>
              </span>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 3).map((review, i) => (
            <Reveal key={review.id} delay={i * 0.12}>
              <ReviewCard
                review={review}
                locale={locale}
                generalLabel={tReviews("generalWork")}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/reviews"
            className="glass rounded-full px-7 py-3.5 font-semibold transition-colors hover:border-primary/60 hover:text-primary"
          >
            {t("viewAll")}
          </Link>
          <Link
            href="/reviews#leave-review"
            className="rounded-full bg-gradient-to-r from-primary to-secondary px-7 py-3.5 font-semibold text-white transition-transform hover:scale-105"
          >
            {t("leaveReview")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
