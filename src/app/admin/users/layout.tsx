import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stricter than the parent /admin layout: super_admin only. An admin
  // wandering here gets bounced back to the area they DO have access to,
  // not to the public homepage.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/admin/sessions");
  }

  return <>{children}</>;
}
