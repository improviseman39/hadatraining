import Setup2faForm from "@/components/onboarding/Setup2faForm";

export const metadata = {
  title: "Set up 2FA — HADA Aesthetic Training",
};

export default function Setup2faPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            Step 3 of 3
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Set up two-factor login
          </h1>
          <p className="mt-2 text-sm text-muted">
            One last step — this adds a second lock on your account using an
            authenticator app on your phone.
          </p>
        </div>
        <Setup2faForm />
      </div>
    </div>
  );
}
