import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in — HADA Aesthetic Training",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("public_signup_enabled")
    .eq("id", true)
    .single();
  const signupEnabled = settings?.public_signup_enabled ?? true;

  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted">
            Use your own email and password, or your class&apos;s shared login.
          </p>
        </div>

        <LoginForm signupEnabled={signupEnabled} />

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="font-medium text-teal hover:underline">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
