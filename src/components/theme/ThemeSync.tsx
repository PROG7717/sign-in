"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyTheme } from "@/lib/theme";
import { safeColor, DEFAULT_SETTINGS, type SiteSettings } from "@/lib/types";

/**
 * Subscribes to realtime changes on portfolio_settings so an admin saving
 * new brand colors instantly re-themes every open tab of the live site.
 */
export default function ThemeSync() {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("portfolio-theme")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "portfolio_settings" },
        (payload) => {
          const row = payload.new as SiteSettings;
          applyTheme({
            primary: safeColor(row.primary_color, DEFAULT_SETTINGS.primary_color),
            secondary: safeColor(row.secondary_color, DEFAULT_SETTINGS.secondary_color),
            accent: safeColor(row.accent_color, DEFAULT_SETTINGS.accent_color),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
