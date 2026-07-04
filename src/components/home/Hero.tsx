"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Magnetic from "@/components/motion/Magnetic";
import CountUp from "@/components/motion/CountUp";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_65%)]" />
  ),
});

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

type Props = {
  avgRating: number;
  reviewCount: number;
};

export default function Hero({ avgRating, reviewCount }: Props) {
  const t = useTranslations("hero");

  const stats = [
    { value: 40, suffix: "+", label: t("stats.projects"), decimals: 0 },
    { value: 8, suffix: "+", label: t("stats.years"), decimals: 0 },
    { value: 30, suffix: "+", label: t("stats.clients"), decimals: 0 },
    {
      value: reviewCount > 0 ? avgRating : 5,
      suffix: "★",
      label: t("stats.rating"),
      decimals: 1,
    },
  ];

  return (
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden">
      {/* 3D backdrop */}
      <div className="absolute inset-0 -z-10">
        <HeroScene />
      </div>
      <div className="bg-grid absolute inset-0 -z-20 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-7xl px-5 pt-28 pb-28 sm:px-8"
      >
        <motion.div variants={item} className="mb-7">
          <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-secondary" />
            </span>
            {t("badge")}
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="max-w-4xl text-5xl leading-[1.06] font-bold tracking-tight sm:text-7xl lg:text-8xl"
        >
          {t("titleTop")} <span className="text-gradient">{t("titleGradient")}</span>{" "}
          {t("titleBottom")}
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            <Link
              href="/work"
              className="glow-primary inline-block rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-4 font-semibold text-white transition-transform hover:scale-105"
            >
              {t("ctaWork")}
            </Link>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="glass inline-block rounded-full px-8 py-4 font-semibold transition-colors hover:border-primary/60 hover:text-primary"
            >
              {t("ctaContact")}
            </a>
          </Magnetic>
        </motion.div>

        <motion.dl
          variants={item}
          className="mt-16 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd className="text-3xl font-bold sm:text-4xl">
                <CountUp
                  to={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                  className="text-gradient"
                />
              </dd>
              <dt className="mt-1 text-sm text-muted">{stat.label}</dt>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-muted"
      >
        <span className="text-xs tracking-widest uppercase">{t("scroll")}</span>
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="block h-8 w-px bg-gradient-to-b from-primary to-transparent"
        />
      </motion.div>
    </section>
  );
}
