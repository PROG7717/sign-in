import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getProjects } from "@/lib/data";
import { localized, PROJECT_CATEGORIES } from "@/lib/types";
import SectionHeader from "@/components/home/SectionHeader";
import WorkGrid from "@/components/projects/WorkGrid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("work");
  return { title: t("title") };
}

export default async function WorkPage() {
  const locale = await getLocale();
  const [t, tCat, projects] = await Promise.all([
    getTranslations("work"),
    getTranslations("categories"),
    getProjects(),
  ]);

  const items = projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: localized(project, "title", locale),
    tagline: localized(project, "tagline", locale),
    category: project.category,
    categoryLabel: tCat(project.category),
    coverUrl: project.cover_url,
    year: project.year,
    featured: project.featured,
  }));

  const presentCategories = PROJECT_CATEGORIES.filter((category) =>
    projects.some((project) => project.category === category),
  ).map((category) => ({ value: category, label: tCat(category) }));

  return (
    <div className="mx-auto max-w-7xl px-5 pt-36 pb-24 sm:px-8">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <WorkGrid
        items={items}
        allLabel={t("filters.all")}
        emptyLabel={t("empty")}
        viewLabel={(await getTranslations("featured"))("viewCase")}
        categories={presentCategories}
      />
    </div>
  );
}
