import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { IBM_Plex_Sans_Arabic, Space_Grotesk } from "next/font/google";
import { routing } from "@/i18n/routing";
import { getSettings } from "@/lib/data";
import { DEFAULT_SETTINGS, safeColor } from "@/lib/types";
import ThemeSync from "@/components/theme/ThemeSync";
import "../globals.css";

const latin = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const [settings, messages] = await Promise.all([getSettings(), getMessages()]);

  const primary = safeColor(settings.primary_color, DEFAULT_SETTINGS.primary_color);
  const secondary = safeColor(settings.secondary_color, DEFAULT_SETTINGS.secondary_color);
  const accent = safeColor(settings.accent_color, DEFAULT_SETTINGS.accent_color);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${latin.variable} ${arabic.variable}`}
    >
      <body className="antialiased">
        {/* Admin-controlled brand colors, injected server-side so there is no flash */}
        <style>{`:root{--primary:${primary};--secondary:${secondary};--accent:${accent};}`}</style>
        <NextIntlClientProvider messages={messages}>
          <ThemeSync />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
