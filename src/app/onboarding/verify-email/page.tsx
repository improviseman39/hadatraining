import VerifyEmailForm from "@/components/onboarding/VerifyEmailForm";

export const metadata = {
  title: "Verify your email — HADA Aesthetic Training",
};

export default function VerifyEmailPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            Step 1 of 3
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-muted">
            We&apos;ve sent a 6-digit code to your email address.
          </p>
        </div>
        <VerifyEmailForm />
      </div>
    </div>
  );
}
