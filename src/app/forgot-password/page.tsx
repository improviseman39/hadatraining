import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Reset your password — HADA Aesthetic Training",
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-muted">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-teal hover:underline">
            &larr; Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
