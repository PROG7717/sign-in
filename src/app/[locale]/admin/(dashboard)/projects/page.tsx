import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import ProjectsManager from "@/components/admin/ProjectsManager";

export default async function AdminProjectsPage() {
  const t = await getTranslations("admin.projects");
  const supabase = await createClient();

  // Admin RLS policy exposes drafts too
  const { data } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="glow-primary rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          + {t("new")}
        </Link>
      </div>

      <ProjectsManager initial={(data ?? []) as Project[]} />
    </div>
  );
}
