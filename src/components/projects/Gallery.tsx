"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  images: string[];
  title: string;
};

export default function Gallery({ images, title }: Props) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setIndex((current) =>
        current === null
          ? null
          : (current + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, step]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src, i) => (
          <motion.button
            key={src + i}
            type="button"
            onClick={() => setIndex(i)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl border border-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} — ${i + 1}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-primary/0 transition-colors duration-300 group-hover:bg-primary/10" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {index !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/92 p-4 backdrop-blur-xl sm:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-full w-full max-w-5xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[index]}
                alt={`${title} — ${index + 1}`}
                className="mx-auto max-h-[82svh] w-auto rounded-2xl border border-line object-contain"
              />
              <p className="mt-3 text-center text-sm text-muted" dir="ltr">
                {index + 1} / {images.length}
              </p>
            </motion.div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="glass absolute top-1/2 left-4 flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-xl hover:border-primary/60"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="glass absolute top-1/2 right-4 flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-xl hover:border-primary/60"
                >
                  ›
                </button>
              </>
            )}

            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="glass absolute top-4 right-4 flex size-12 items-center justify-center rounded-full text-xl hover:border-accent/70 hover:text-accent"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
