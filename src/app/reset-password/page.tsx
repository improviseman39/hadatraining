import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Reset your password — HADA Aesthetic Training",
};

export default function ResetPasswordPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Choose a new password
          </h1>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
