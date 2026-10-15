"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type ProjectOption = { id: string; title: string };

export default function ReviewForm({ projects }: { projects: ProjectOption[] }) {
  const t = useTranslations("reviews.form");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [projectId, setProjectId] = useState("");
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");

    const supabase = createClient();
    const { error } = await supabase.from("portfolio_reviews").insert({
      author_name: name.trim(),
      author_role: role.trim(),
      project_id: projectId || null,
      rating,
      comment: comment.trim(),
      locale,
      status: "pending",
    });

    if (error) {
      setState("error");
      return;
    }
    setState("success");
    setName("");
    setRole("");
    setProjectId("");
    setRating(5);
    setComment("");
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/25";

  return (
    <form id="leave-review" onSubmit={onSubmit} className="glass rounded-3xl p-7 sm:p-9">
      <h3 className="text-2xl font-bold">{t("title")}</h3>
      <p className="mt-2 mb-7 text-muted">{t("subtitle")}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">{t("name")}</span>
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">{t("role")}</span>
          <input
            maxLength={120}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={t("rolePlaceholder")}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">{t("project")}</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("generalOption")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium">{t("rating")}</span>
          <div className="flex items-center gap-1.5 py-2" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${star}/5`}
                className="cursor-pointer"
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`transition-all duration-150 ${
                    star <= (hovered || rating)
                      ? "scale-110 text-accent"
                      : "text-white/15"
                  }`}
                >
                  <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.58L12 17.57l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">{t("comment")}</span>
          <textarea
            required
            minLength={3}
            maxLength={2000}
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="glow-primary rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-3.5 font-semibold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? t("submitting") : t("submit")}
        </button>

        {state === "success" && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-secondary"
          >
            {t("success")}
          </motion.p>
        )}
        {state === "error" && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-accent"
          >
            {t("error")}
          </motion.p>
        )}
      </div>
    </form>
  );
}
