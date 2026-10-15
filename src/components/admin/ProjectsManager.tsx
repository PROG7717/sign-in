"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import { localized } from "@/lib/types";

export default function ProjectsManager({ initial }: { initial: Project[] }) {
  const t = useTranslations("admin.projects");
  const locale = useLocale();
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(project: Project, field: "featured" | "published") {
    setBusyId(project.id);
    const supabase = createClient();
    const value = !project[field];
    const { error } = await supabase
      .from("portfolio_projects")
      .update({ [field]: value })
      .eq("id", project.id);
    if (!error) {
      setProjects((list) =>
        list.map((p) => (p.id === project.id ? { ...p, [field]: value } : p)),
      );
      router.refresh();
    }
    setBusyId(null);
  }

  async function remove(project: Project) {
    if (!window.confirm(t("confirmDelete"))) return;
    setBusyId(project.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("portfolio_projects")
      .delete()
      .eq("id", project.id);
    if (!error) {
      setProjects((list) => list.filter((p) => p.id !== project.id));
      router.refresh();
    }
    setBusyId(null);
  }

  if (projects.length === 0) {
    return <p className="glass rounded-3xl p-12 text-center text-muted">{t("empty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li
          key={project.id}
          className={`glass flex flex-wrap items-center gap-4 rounded-2xl p-4 transition-opacity ${
            busyId === project.id ? "opacity-50" : ""
          }`}
        >
          <span className="block h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
            {project.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.cover_url}
                alt=""
                className="size-full object-cover"
              />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {localized(project, "title", locale)}
            </p>
            <p className="truncate text-sm text-muted">
              /{project.slug} · {project.category} {project.year ? `· ${project.year}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggle(project, "featured")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                project.featured
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                  : "bg-white/5 text-muted hover:text-foreground"
              }`}
            >
              ★ {t("featured")}
            </button>
            <button
              type="button"
              onClick={() => toggle(project, "published")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                project.published
                  ? "bg-secondary/15 text-secondary ring-1 ring-secondary/40"
                  : "bg-accent/10 text-accent ring-1 ring-accent/30"
              }`}
            >
              {project.published ? t("published") : t("draft")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/projects/${project.id}`}
              className="glass rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
            >
              {t("edit")}
            </Link>
            <button
              type="button"
              onClick={() => remove(project)}
              className="rounded-full border border-accent/40 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
            >
              {t("delete")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
