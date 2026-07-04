"use client";

import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/motion/TiltCard";

type Props = {
  slug: string;
  title: string;
  tagline: string;
  categoryLabel: string;
  coverUrl: string | null;
  year: number | null;
  viewLabel: string;
  large?: boolean;
};

export default function ProjectCard({
  slug,
  title,
  tagline,
  categoryLabel,
  coverUrl,
  year,
  viewLabel,
  large = false,
}: Props) {
  return (
    <TiltCard className={large ? "sm:col-span-2" : ""}>
      <Link
        href={`/work/${slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-line bg-surface"
      >
        <div className={`relative overflow-hidden ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
          {coverUrl ? (
            // Covers may be SVGs or Supabase Storage uploads — plain <img>
            // keeps both working without image-loader configuration.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--primary)_35%,transparent),var(--surface))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-secondary/10 px-2.5 py-1 font-medium text-secondary ring-1 ring-secondary/30">
                {categoryLabel}
              </span>
              {year && <span>{year}</span>}
            </div>
            <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted">{tagline}</p>
          </div>

          <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 motion-safe:translate-y-2 motion-safe:group-hover:translate-y-0">
            {viewLabel}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="rtl:-scale-x-100"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </TiltCard>
  );
}
