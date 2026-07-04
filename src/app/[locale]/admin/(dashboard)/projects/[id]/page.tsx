import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import ProjectForm from "@/components/admin/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin.projects.form");
  const supabase = await createClient();

  const { data } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-3xl font-bold">{t("editTitle")}</h1>
      <ProjectForm initial={data as Project} />
    </div>
  );
}
