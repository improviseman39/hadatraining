import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create your account — HADA Aesthetic Training",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("public_signup_enabled")
    .eq("id", true)
    .single();
  // Fail open (form stays reachable) if the settings row is somehow
  // missing, rather than locking everyone out of registration.
  const signupEnabled = settings?.public_signup_enabled ?? true;

  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            {signupEnabled ? "Create your account" : "Registration is closed"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {signupEnabled
              ? "For HADA-trained doctors, nurses, and aesthetic clinic staff."
              : "Self-registration isn't open right now."}
          </p>
        </div>

        {signupEnabled ? (
          <SignupForm />
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center shadow-sm sm:p-8">
            <p className="text-sm leading-relaxed text-ink">
              If you attended a HADA class, use the shared class login your
              coordinator gave you instead.
            </p>
            <Link
              href="/class-login"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-teal px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
            >
              Go to class login
            </Link>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
