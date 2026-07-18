import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Log in — HADA Aesthetic Training",
};

export default function LoginPage() {
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
            Log in to unlock the full member curriculum.
          </p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="font-medium text-teal hover:underline">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
