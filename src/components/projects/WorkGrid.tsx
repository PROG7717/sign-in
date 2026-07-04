"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectCard from "./ProjectCard";

export type WorkItem = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  categoryLabel: string;
  coverUrl: string | null;
  year: number | null;
  featured: boolean;
};

type Props = {
  items: WorkItem[];
  allLabel: string;
  emptyLabel: string;
  viewLabel: string;
  categories: { value: string; label: string }[];
};

export default function WorkGrid({
  items,
  allLabel,
  emptyLabel,
  viewLabel,
  categories,
}: Props) {
  const [active, setActive] = useState("all");

  const filtered = useMemo(
    () => (active === "all" ? items : items.filter((p) => p.category === active)),
    [items, active],
  );

  const filters = [{ value: "all", label: allLabel }, ...categories];

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2.5">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActive(filter.value)}
            className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              active === filter.value
                ? "text-white"
                : "glass text-muted hover:text-foreground"
            }`}
          >
            {active === filter.value && (
              <motion.span
                layoutId="work-filter"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative">{filter.label}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="glass rounded-3xl p-12 text-center text-muted">{emptyLabel}</p>
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                className={project.featured && i === 0 ? "sm:col-span-2" : ""}
              >
                <ProjectCard
                  slug={project.slug}
                  title={project.title}
                  tagline={project.tagline}
                  categoryLabel={project.categoryLabel}
                  coverUrl={project.coverUrl}
                  year={project.year}
                  viewLabel={viewLabel}
                  large={project.featured && i === 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
