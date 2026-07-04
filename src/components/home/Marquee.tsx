import { getTranslations } from "next-intl/server";

export default async function Marquee() {
  const t = await getTranslations("marquee");
  const items = t("items");

  return (
    <div className="relative overflow-hidden border-y border-line py-5" dir="ltr">
      <div className="marquee-track flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <span
            key={copy}
            aria-hidden={copy === 1}
            className="text-sm font-medium tracking-[0.2em] text-muted uppercase"
          >
            {items} • {items}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
