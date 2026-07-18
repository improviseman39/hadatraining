import SetPasswordForm from "@/components/onboarding/SetPasswordForm";

export const metadata = {
  title: "Set a new password — HADA Aesthetic Training",
};

export default function SetPasswordPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            Step 2 of 3
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Set your password
          </h1>
          <p className="mt-2 text-sm text-muted">
            Replace the temporary password you were given with one only you know.
            You&apos;ll only be asked to do this once.
          </p>
        </div>
        <SetPasswordForm />
      </div>
    </div>
  );
}
