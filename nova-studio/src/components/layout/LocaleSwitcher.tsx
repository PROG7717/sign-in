"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Toggles between English and Arabic while preserving the current route. */
export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const next = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="glass rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-foreground transition-colors hover:border-primary/60 hover:text-primary"
      aria-label={next === "ar" ? "التبديل إلى العربية" : "Switch to English"}
    >
      {next === "ar" ? "عربي" : "EN"}
    </button>
  );
}
