import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Project } from "@/lib/types";
import { localized } from "@/lib/types";
import Reveal from "@/components/motion/Reveal";
import ProjectCard from "@/components/projects/ProjectCard";
import SectionHeader from "./SectionHeader";

export default async function FeaturedWork({ projects }: { projects: Project[] }) {
  const locale = await getLocale();
  const t = await getTranslations("featured");
  const tCat = await getTranslations("categories");

  if (projects.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.id} delay={i * 0.1}>
            <ProjectCard
              slug={project.slug}
              title={localized(project, "title", locale)}
              tagline={localized(project, "tagline", locale)}
              categoryLabel={tCat(project.category)}
              coverUrl={project.cover_url}
              year={project.year}
              viewLabel={t("viewCase")}
              large={i === 0}
            />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 text-center">
        <Link
          href="/work"
          className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold transition-colors hover:border-primary/60 hover:text-primary"
        >
          {t("viewAll")}
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
        </Link>
      </Reveal>
    </section>
  );
}
