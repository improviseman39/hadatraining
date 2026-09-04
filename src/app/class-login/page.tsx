import Link from "next/link";
import ClassLoginForm from "@/components/ClassLoginForm";

export const metadata = {
  title: "Class login — HADA Aesthetic Training",
};

export default function ClassLoginPage() {
  return (
    <div className="container-page flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
            Class login
          </h1>
          <p className="mt-2 text-sm text-muted">
            Enter the shared username and password given to your class.
          </p>
        </div>

        <ClassLoginForm />

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="font-medium text-teal hover:underline">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
