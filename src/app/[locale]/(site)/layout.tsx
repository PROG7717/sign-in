import { getSettings } from "@/lib/data";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSettings();
  const siteName = locale === "ar" ? settings.site_name_ar : settings.site_name_en;

  return (
    <>
      <Navbar siteName={siteName} />
      <main>{children}</main>
      <Footer siteName={siteName} />
    </>
  );
}
