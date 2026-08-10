import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

export default async function AdminIndexPage() {
  const { role } = await requireRole(["design", "admin", "super_admin"]);
  redirect(role === "design" ? "/admin/design" : "/admin/sessions");
}
