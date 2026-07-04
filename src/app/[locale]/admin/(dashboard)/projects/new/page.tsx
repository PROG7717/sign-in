import { getTranslations } from "next-intl/server";
import ProjectForm from "@/components/admin/ProjectForm";

export default async function NewProjectPage() {
  const t = await getTranslations("admin.projects.form");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-3xl font-bold">{t("createTitle")}</h1>
      <ProjectForm />
    </div>
  );
}
