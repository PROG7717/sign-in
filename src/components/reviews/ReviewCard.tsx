import type { Review } from "@/lib/types";
import { localized } from "@/lib/types";
import StarRating from "./StarRating";

type Props = {
  review: Review;
  locale: string;
  /** Label shown when the review is about the overall collaboration */
  generalLabel?: string;
};

export default function ReviewCard({ review, locale, generalLabel }: Props) {
  const projectTitle = review.project
    ? localized(review.project, "title", locale)
    : null;

  return (
    <figure className="glass flex h-full flex-col gap-4 rounded-3xl p-6 transition-colors duration-300 hover:border-primary/40">
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={review.rating} />
        {(projectTitle || generalLabel) && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
            {projectTitle ?? generalLabel}
          </span>
        )}
      </div>

      <blockquote
        dir="auto"
        className="flex-1 leading-relaxed text-foreground/90"
      >
        “{review.comment}”
      </blockquote>

      <figcaption className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-sm font-bold text-white"
        >
          {review.author_name.trim().charAt(0).toUpperCase()}
        </span>
        <span>
          <span className="block text-sm font-semibold">{review.author_name}</span>
          {review.author_role && (
            <span className="block text-xs text-muted">{review.author_role}</span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
