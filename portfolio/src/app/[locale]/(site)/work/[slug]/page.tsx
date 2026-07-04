import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProjectBySlug, getProjectReviews, getProjects } from "@/lib/data";
import { localized } from "@/lib/types";
import Reveal from "@/components/motion/Reveal";
import Gallery from "@/components/projects/Gallery";
import ReviewCard from "@/components/reviews/ReviewCard";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: localized(project, "title", locale),
    description: localized(project, "tagline", locale),
  };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [t, tCat, tReviews, reviews, allProjects] = await Promise.all([
    getTranslations("project"),
    getTranslations("categories"),
    getTranslations("reviews"),
    getProjectReviews(project.id),
    getProjects(),
  ]);

  const title = localized(project, "title", locale);
  const tagline = localized(project, "tagline", locale);
  const description = localized(project, "description", locale);
  const paragraphs = description.split(/\n{2,}/).filter(Boolean);

  const index = allProjects.findIndex((p) => p.id === project.id);
  const nextProject =
    allProjects.length > 1
      ? allProjects[(index + 1) % allProjects.length]
      : null;

  return (
    <article className="pb-24">
      {/* Cover hero */}
      <header className="relative flex min-h-[62svh] items-end overflow-hidden">
        {project.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_url}
            alt={title}
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-40 pb-14 sm:px-8">
          <Reveal>
            <Link
              href="/work"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="rtl:-scale-x-100"
              >
                <path d="M19 12H5M11 19l-7-7 7-7" />
              </svg>
              {t("back")}
            </Link>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted sm:text-xl">{tagline}</p>
          </Reveal>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Meta */}
        <Reveal className="mt-12">
          <dl className="glass grid gap-6 rounded-3xl p-7 sm:grid-cols-3">
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-widest text-muted uppercase">
                {t("year")}
              </dt>
              <dd className="text-lg font-semibold">{project.year ?? "—"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-widest text-muted uppercase">
                {t("category")}
              </dt>
              <dd className="text-lg font-semibold">{tCat(project.category)}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-widest text-muted uppercase">
                {t("stack")}
              </dt>
              <dd className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary ring-1 ring-secondary/30"
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Reveal>

        {/* Description */}
        <Reveal className="mx-auto mt-14 max-w-3xl">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="mb-6 text-lg leading-relaxed text-foreground/85">
              {paragraph}
            </p>
          ))}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="glow-primary mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-7 py-3.5 font-semibold text-white transition-transform hover:scale-105"
            >
              {t("visit")}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M8 7h9v9" />
              </svg>
            </a>
          )}
        </Reveal>

        {/* Gallery */}
        {project.gallery.length > 0 && (
          <section className="mt-20">
            <Reveal>
              <h2 className="mb-8 text-2xl font-bold sm:text-3xl">{t("gallery")}</h2>
            </Reveal>
            <Gallery images={project.gallery} title={title} />
          </section>
        )}

        {/* Client reviews for this project */}
        {reviews.length > 0 && (
          <section className="mt-20">
            <Reveal>
              <h2 className="mb-8 text-2xl font-bold sm:text-3xl">{t("clientWords")}</h2>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              {reviews.map((review, i) => (
                <Reveal key={review.id} delay={i * 0.1}>
                  <ReviewCard
                    review={review}
                    locale={locale}
                    generalLabel={tReviews("generalWork")}
                  />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Next project */}
        {nextProject && (
          <Reveal className="mt-24">
            <Link
              href={`/work/${nextProject.slug}`}
              className="group glass flex items-center justify-between gap-6 rounded-3xl p-8 transition-colors hover:border-primary/50 sm:p-10"
            >
              <div>
                <p className="mb-2 text-sm font-semibold tracking-widest text-muted uppercase">
                  {t("nextProject")}
                </p>
                <p className="text-2xl font-bold sm:text-4xl">
                  {localized(nextProject, "title", locale)}
                </p>
              </div>
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white transition-transform duration-300 group-hover:scale-110">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="rtl:-scale-x-100"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </Reveal>
        )}
      </div>
    </article>
  );
}
