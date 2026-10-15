import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin.settings");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 mb-10 text-muted">{t("subtitle")}</p>
      <SettingsForm initial={settings} />
    </div>
  );
}
