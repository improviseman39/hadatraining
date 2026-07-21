import Link from "next/link";
import SignupForm from "@/components/SignupForm";

export const metadata = {
  title: "Create your account — HADA Aesthetic Training",
};

export default function SignupPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted">
            For HADA-trained doctors, nurses, and aesthetic clinic staff.
          </p>
        </div>

        <SignupForm />

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
