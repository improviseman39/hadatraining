"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string; success?: boolean } | undefined;

export default function QaEntryForm({
  action,
  defaultValues,
  submitLabel,
  showPrivacyReminder,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: {
    question?: string;
    answer?: string;
  };
  submitLabel: string;
  /** Shown when the fields were pre-filled from a member's request — staff need to scrub any personal details before this goes public. */
  showPrivacyReminder?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {showPrivacyReminder && (
        <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 px-4 py-3 text-sm">
          <p className="font-medium text-terracotta">Check for private details before publishing</p>
          <p className="mt-1 text-ink/80">
            This was pre-filled from a member&apos;s request. This page will be public — remove
            any names, emails, phone numbers, or other personal information from the question and
            answer below before saving.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Question</label>
        <textarea
          name="question"
          required
          rows={2}
          defaultValue={defaultValues?.question}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Answer</label>
        <textarea
          name="answer"
          required
          rows={5}
          defaultValue={defaultValues?.answer}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {saved && <p className="text-sm font-medium text-teal">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
