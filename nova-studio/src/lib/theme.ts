"use client";

export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export const THEME_EVENT = "portfolio:theme";

export const DEFAULT_THEME: ThemeColors = {
  primary: "#8b5cf6",
  secondary: "#22d3ee",
  accent: "#fb7185",
};

/** Write theme colors onto :root and notify listeners (e.g. the 3D hero). */
export function applyTheme(colors: Partial<ThemeColors>) {
  const root = document.documentElement;
  if (colors.primary) root.style.setProperty("--primary", colors.primary);
  if (colors.secondary) root.style.setProperty("--secondary", colors.secondary);
  if (colors.accent) root.style.setProperty("--accent", colors.accent);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: colors }));
}

/** Read the currently active theme colors from CSS variables. */
export function readTheme(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    primary: read("--primary", DEFAULT_THEME.primary),
    secondary: read("--secondary", DEFAULT_THEME.secondary),
    accent: read("--accent", DEFAULT_THEME.accent),
  };
}
