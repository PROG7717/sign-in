import Reveal from "@/components/motion/Reveal";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export default function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <Reveal className="mb-12">
      <p className="mb-3 flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
        <span className="inline-block h-px w-8 bg-primary" />
        {eyebrow}
      </p>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 max-w-xl text-lg text-muted">{subtitle}</p>}
    </Reveal>
  );
}
