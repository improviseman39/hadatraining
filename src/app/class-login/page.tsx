import { redirect } from "next/navigation";

// Class login and individual login are now the same page/form — see
// LoginForm.tsx and login() in src/lib/actions/classLogin.ts. This route
// stays as a redirect rather than disappearing outright, in case anyone
// bookmarked or was sent a direct /class-login link.
export default function ClassLoginPage() {
  redirect("/login");
}
