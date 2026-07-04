import { getTranslations } from "next-intl/server";
import Reveal from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";

export default async function ContactCTA() {
  const t = await getTranslations("cta");

  return (
    <section id="contact" className="relative overflow-hidden py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklab,var(--secondary)_12%,transparent),transparent_65%)]" />
      <div className="bg-grid absolute inset-0 -z-20 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <Reveal className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
          <span className="text-gradient">{t("title")}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted">{t("subtitle")}</p>
        <div className="mt-10 flex justify-center">
          <Magnetic>
            <a
              href="mailto:ibr5ab2i@gmail.com"
              className="glow-primary inline-block rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-10 py-5 text-lg font-bold text-white transition-transform hover:scale-105"
            >
              {t("button")}
            </a>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
