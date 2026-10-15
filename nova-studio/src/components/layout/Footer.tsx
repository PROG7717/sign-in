import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Footer({ siteName }: { siteName: string }) {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-12 sm:px-8 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <div className="flex items-center gap-2.5">
            <span className="inline-block size-2.5 rounded-full bg-gradient-to-tr from-primary to-secondary" />
            <span className="font-bold">{siteName}</span>
          </div>
          <p className="text-sm text-muted">{t("tagline")}</p>
        </div>

        <p className="text-sm text-muted">
          © {year} {siteName}. {t("rights")}
        </p>

        <Link
          href="/admin"
          className="text-xs text-muted/60 transition-colors hover:text-primary"
        >
          {t("adminLogin")}
        </Link>
      </div>
    </footer>
  );
}
