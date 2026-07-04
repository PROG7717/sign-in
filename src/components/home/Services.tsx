import { getTranslations } from "next-intl/server";
import Reveal from "@/components/motion/Reveal";
import SectionHeader from "./SectionHeader";

const icons: Record<string, React.ReactNode> = {
  immersive: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" />
      <path d="M12 22V12M12 12L3.5 7M12 12l8.5-5" />
    </svg>
  ),
  product: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4M7 9h5M7 12h8" />
    </svg>
  ),
  brand: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 010 18M7 12h10" />
    </svg>
  ),
};

export default async function Services() {
  const t = await getTranslations("services");
  const keys = ["immersive", "product", "brand"] as const;

  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <SectionHeader eyebrow={t("title")} title={t("subtitle")} />
      <div className="grid gap-5 md:grid-cols-3">
        {keys.map((key, i) => (
          <Reveal key={key} delay={i * 0.12}>
            <article className="glass group h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40">
              <span className="mb-6 inline-flex size-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/25 to-secondary/25 text-primary ring-1 ring-primary/30 transition-transform duration-300 group-hover:scale-110">
                {icons[key]}
              </span>
              <h3 className="mb-2.5 text-xl font-bold">{t(`items.${key}.title`)}</h3>
              <p className="leading-relaxed text-muted">{t(`items.${key}.body`)}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
