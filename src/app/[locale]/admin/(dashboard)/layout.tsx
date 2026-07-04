import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/admin/login", locale });

  // RLS-backed check: non-admin accounts cannot see this table at all
  const { data: adminRow } = await supabase
    .from("portfolio_admins")
    .select("user_id")
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!adminRow) redirect({ href: "/admin/login", locale });

  return <AdminShell email={user!.email ?? ""}>{children}</AdminShell>;
}
