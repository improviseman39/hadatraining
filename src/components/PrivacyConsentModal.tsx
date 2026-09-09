"use client";

import { useState } from "react";

const POINTS_EN = [
  "We collect your name, email, and course activity to run your account and track your progress.",
  "Your account data and video lessons are stored and hosted by trusted third-party service providers on our behalf.",
  "We never sell your data or use it for advertising.",
  "You can request access, correction, or deletion at any time via Contact us.",
];

const POINTS_TH = [
  "เราเก็บชื่อ อีเมล และกิจกรรมการเรียนของท่าน เพื่อดูแลบัญชีและติดตามความคืบหน้า",
  "ข้อมูลบัญชีและวิดีโอบทเรียนของท่านจัดเก็บและโฮสต์โดยผู้ให้บริการบุคคลที่สามที่เชื่อถือได้ในนามของเรา",
  "เราไม่ขายข้อมูลของท่านหรือนำไปใช้เพื่อการโฆษณา",
  "ท่านสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลได้ทุกเมื่อผ่าน Contact us",
];

/**
 * Gates a registration form behind a bilingual consent popup — rendered by
 * the parent only while consent hasn't been given yet, so agreeing just
 * unmounts this and reveals the form that was already there underneath.
 * Kept out of the post-login onboarding chain (verify email / set password
 * / 2FA) entirely: that chain has broken before on a stray unhandled
 * rejection, and consent only needs a client-side gate plus a server-side
 * check at the point of account creation, not a new step in that chain.
 */
export default function PrivacyConsentModal({
  onAgree,
}: {
  onAgree: () => void;
}) {
  const [lang, setLang] = useState<"en" | "th">("en");
  const [checked, setChecked] = useState(false);
  const points = lang === "en" ? POINTS_EN : POINTS_TH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-serif text-lg text-ink">
            {lang === "en" ? "Your privacy" : "ความเป็นส่วนตัวของท่าน"}
          </h2>
          <div className="flex shrink-0 gap-1 rounded-full border border-ink/15 bg-porcelain p-0.5">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                lang === "en" ? "bg-teal text-porcelain" : "text-muted hover:text-ink"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("th")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                lang === "th" ? "bg-teal text-porcelain" : "text-muted hover:text-ink"
              }`}
            >
              ไทย
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-muted">
            {lang === "en"
              ? "Before you continue, here's a quick summary of how HADA Aesthetic Training handles your personal data:"
              : "ก่อนดำเนินการต่อ นี่คือสรุปสั้น ๆ ว่า HADA Aesthetic Training จัดการข้อมูลส่วนบุคคลของท่านอย่างไร:"}
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {points.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-teal">&bull;</span>
                {point}
              </li>
            ))}
          </ul>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-teal hover:underline"
          >
            {lang === "en" ? "Read the full privacy policy" : "อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม"} &rarr;
          </a>
        </div>

        <div className="border-t border-ink/10 px-6 py-5">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink/25 text-teal focus:ring-teal/30"
            />
            <span>
              {lang === "en"
                ? "I have read and agree to the Privacy Policy."
                : "ฉันได้อ่านและยอมรับนโยบายความเป็นส่วนตัวนี้"}
              <span className="block text-xs text-muted">
                {lang === "en"
                  ? "ฉันได้อ่านและยอมรับนโยบายความเป็นส่วนตัวนี้"
                  : "I have read and agree to the Privacy Policy."}
              </span>
            </span>
          </label>

          <button
            type="button"
            disabled={!checked}
            onClick={onAgree}
            className="mt-4 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lang === "en" ? "Agree & continue" : "ยอมรับและดำเนินการต่อ"}
          </button>
        </div>
      </div>
    </div>
  );
}
