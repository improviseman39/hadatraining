"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "@/app/signup/actions";
import { THAILAND_PROVINCES, CLINIC_POSITIONS, HADA_CLASS_YEARS } from "@/data/thailand";

const inputClass =
  "w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "mb-2 block text-sm font-medium text-ink";

export default function SignupForm() {
  const [isClinicOwner, setIsClinicOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setAlreadyExists(false);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
        setAlreadyExists(Boolean(result.alreadyExists));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
    >
      <div>
        <label htmlFor="full_name" className={labelClass}>Full name</label>
        <input id="full_name" name="full_name" required autoComplete="name" className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@clinic.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Phone number</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="08x-xxx-xxxx" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="position" className={labelClass}>Your role</label>
          <select id="position" name="position" required defaultValue="" className={inputClass}>
            <option value="" disabled>Select one</option>
            {CLINIC_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="class_year" className={labelClass}>HADA class year</label>
          <select id="class_year" name="class_year" required defaultValue="" className={inputClass}>
            <option value="" disabled>Select one</option>
            {HADA_CLASS_YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="province" className={labelClass}>Province</label>
        <select id="province" name="province" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select one</option>
          {THAILAND_PROVINCES.map((province) => (
            <option key={province} value={province}>{province}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="is_clinic_owner"
            checked={isClinicOwner}
            onChange={(event) => setIsClinicOwner(event.target.checked)}
            className="h-4 w-4 rounded border-ink/25 text-teal focus:ring-teal/30"
          />
          I own a clinic
        </label>
        {isClinicOwner && (
          <input
            name="clinic_name"
            required
            placeholder="Clinic name"
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-terracotta">
          {error}
          {alreadyExists && (
            <>
              {" "}
              <Link href="/login" className="underline">Log in</Link>, or if you forgot your
              password,{" "}
              <Link href="/forgot-password" className="underline">reset it</Link>.
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
      >
        {pending ? "Creating your account…" : "Create account"}
      </button>

      <p className="text-center text-xs leading-relaxed text-muted">
        After this, you&apos;ll be asked to verify your email and set up two-factor authentication
        to finish securing your account.
      </p>
    </form>
  );
}
