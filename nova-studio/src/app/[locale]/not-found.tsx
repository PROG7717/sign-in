import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("project");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-5 text-center">
      <p className="text-8xl font-bold text-gradient">404</p>
      <p className="text-xl text-muted">{t("notFound")}</p>
      <Link
        href="/"
        className="glow-primary rounded-full bg-gradient-to-r from-primary to-secondary px-7 py-3.5 font-semibold text-white transition-transform hover:scale-105"
      >
        ← {t("back")}
      </Link>
    </div>
  );
}
