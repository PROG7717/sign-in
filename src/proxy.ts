import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./lib/supabase/config";

const handleI18nRouting = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Keep the Supabase auth session fresh on every request so server
  // components can rely on cookies() containing a valid session.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip static assets, images and Next internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
