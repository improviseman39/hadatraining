"use client";

import { useState } from "react";
import Link from "next/link";
import { POLICY_VERSION } from "@/lib/privacyPolicy";

const LAST_UPDATED = "September 2026";

type Section = { heading: string; body: string[] };

const EN: { intro: string[]; sections: Section[] } = {
  intro: [
    `This policy explains what personal data HADA Aesthetic Training ("HADA", "we", "us") collects through this website, why we collect it, and the choices you have. It applies to every account on this site, including an individual account and a seat created through a class's shared login.`,
    `We are a clinical training provider based in Thailand, and we handle personal data under the Personal Data Protection Act B.E. 2562 (2019) ("Thailand PDPA").`,
  ],
  sections: [
    {
      heading: "Information we collect",
      body: [
        "Account details you give us directly: full name, email address, and (for an individually-registered account) phone number, clinic role, clinic name, and province.",
        "Login and security data: your password (stored as a one-way hash we cannot read), and — if you use a class's shared login — a device token stored in your browser so we can recognise your device on return visits without asking for the shared password to be re-typed every time.",
        "Course activity: which sessions and lessons you view, your completion progress, and (if you book one) your timetable bookings.",
        "Anything you send us: messages through the Contact us widget or Q&A feature, and any content of those messages.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "To create and secure your account, including email verification and two-factor authentication.",
        "To deliver the curriculum to you and track your own progress through it.",
        "To respond to questions or requests you send us.",
        "To keep the class-login system working as intended — recognising a returning device and enforcing each class's seat limit.",
        "We do not sell your personal data, and we do not use it for advertising.",
      ],
    },
    {
      heading: "Who else sees it",
      body: [
        "A specialized third-party cloud database and authentication provider stores your account and course-progress data securely on our behalf, under a data-processing agreement that limits them to our instructions.",
        "A specialized third-party video-hosting provider hosts the video lessons you watch; playing a video may share standard technical information (such as your IP address) with that provider.",
        "We do not share your personal data with any other third party except where required by law.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "We keep your account and course-progress data for as long as your account is active, and for a reasonable period afterward for training-record and legal purposes. You can ask us to delete your account at any time (see \"Your rights\" below).",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under the Thailand PDPA, you have the right to access, correct, delete, or request a copy of your personal data, and to withdraw consent at any time. Withdrawing consent does not affect anything we did with your data before the withdrawal.",
        "To exercise any of these rights, use the Contact us button on this site and we will respond as soon as we reasonably can.",
      ],
    },
    {
      heading: "Cookies and device recognition",
      body: [
        "We use a small number of strictly necessary cookies: one to keep you signed in, and — only if you use a class's shared login — one that lets your specific device be recognised on return visits. We do not use advertising or tracking cookies.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "If we make a material change to this policy, we will ask new registrants to agree to the updated version going forward. We will not retroactively require an existing account to re-accept it.",
      ],
    },
    {
      heading: "Contact us",
      body: [
        "For any question about this policy or your personal data, use the Contact us button available throughout this site.",
      ],
    },
  ],
};

const TH: { intro: string[]; sections: Section[] } = {
  intro: [
    `นโยบายฉบับนี้อธิบายว่า HADA Aesthetic Training ("HADA", "เรา") เก็บข้อมูลส่วนบุคคลใดบ้างผ่านเว็บไซต์นี้ เก็บไปเพื่ออะไร และท่านมีทางเลือกอะไรบ้าง นโยบายนี้ใช้กับบัญชีผู้ใช้ทุกประเภทบนเว็บไซต์นี้ ทั้งบัญชีส่วนบุคคลและบัญชี (seat) ที่สร้างผ่านรหัสผ่านที่ใช้ร่วมกันของรุ่นเรียน`,
    `เราเป็นผู้ให้บริการฝึกอบรมทางคลินิกในประเทศไทย และดำเนินการกับข้อมูลส่วนบุคคลภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)`,
  ],
  sections: [
    {
      heading: "ข้อมูลที่เราเก็บ",
      body: [
        "ข้อมูลบัญชีที่ท่านให้ไว้โดยตรง: ชื่อ-นามสกุล อีเมล และ (สำหรับบัญชีที่ลงทะเบียนด้วยตนเอง) เบอร์โทรศัพท์ ตำแหน่งในคลินิก ชื่อคลินิก และจังหวัด",
        "ข้อมูลการเข้าสู่ระบบและความปลอดภัย: รหัสผ่านของท่าน (จัดเก็บในรูปแบบเข้ารหัสทางเดียวที่เราไม่สามารถอ่านได้) และหากท่านใช้รหัสผ่านที่ใช้ร่วมกันของรุ่นเรียน จะมีโทเคนอุปกรณ์ (device token) เก็บไว้ในเบราว์เซอร์ของท่าน เพื่อให้ระบบจดจำอุปกรณ์ของท่านได้เมื่อกลับมาใช้งานอีกครั้ง โดยไม่ต้องพิมพ์รหัสผ่านที่ใช้ร่วมกันซ้ำทุกครั้ง",
        "กิจกรรมการเรียน: เซสชันและบทเรียนที่ท่านเปิดดู ความคืบหน้าในการเรียน และการจองตารางเวลา (หากมีการจอง)",
        "ข้อความที่ท่านส่งถึงเรา: ผ่านช่องทาง Contact us หรือฟีเจอร์ Q&A รวมถึงเนื้อหาของข้อความเหล่านั้น",
      ],
    },
    {
      heading: "เราใช้ข้อมูลอย่างไร",
      body: [
        "เพื่อสร้างและรักษาความปลอดภัยของบัญชีท่าน รวมถึงการยืนยันอีเมลและการยืนยันตัวตนสองขั้นตอน",
        "เพื่อนำส่งหลักสูตรให้ท่านและติดตามความคืบหน้าในการเรียนของท่านเอง",
        "เพื่อตอบคำถามหรือคำขอที่ท่านส่งถึงเรา",
        "เพื่อให้ระบบรหัสผ่านร่วมของรุ่นเรียนทำงานได้ตามที่ออกแบบไว้ เช่น การจดจำอุปกรณ์ที่กลับมาใช้งาน และการจำกัดจำนวนที่นั่งของแต่ละรุ่น",
        "เราไม่ขายข้อมูลส่วนบุคคลของท่าน และไม่นำไปใช้เพื่อการโฆษณา",
      ],
    },
    {
      heading: "ใครอีกบ้างที่เห็นข้อมูลของท่าน",
      body: [
        "ผู้ให้บริการฐานข้อมูลและระบบยืนยันตัวตนบุคคลที่สามซึ่งเชี่ยวชาญด้านนี้โดยเฉพาะ จัดเก็บข้อมูลบัญชีและความคืบหน้าการเรียนของท่านอย่างปลอดภัยในนามของเรา ภายใต้ข้อตกลงการประมวลผลข้อมูลที่จำกัดให้ดำเนินการตามคำสั่งของเราเท่านั้น",
        "ผู้ให้บริการโฮสต์วิดีโอบุคคลที่สามซึ่งเชี่ยวชาญด้านนี้โดยเฉพาะ เป็นผู้โฮสต์วิดีโอบทเรียนที่ท่านรับชม การเล่นวิดีโออาจมีการส่งข้อมูลทางเทคนิคพื้นฐาน (เช่น IP address) ไปยังผู้ให้บริการรายนั้น",
        "เราจะไม่แบ่งปันข้อมูลส่วนบุคคลของท่านกับบุคคลที่สามรายอื่นใด เว้นแต่กฎหมายกำหนด",
      ],
    },
    {
      heading: "ระยะเวลาที่เราเก็บข้อมูล",
      body: [
        "เราเก็บข้อมูลบัญชีและความคืบหน้าการเรียนของท่านตราบเท่าที่บัญชีของท่านยังใช้งานอยู่ และเก็บต่อไปอีกระยะเวลาหนึ่งตามสมควรเพื่อวัตถุประสงค์ด้านหลักฐานการฝึกอบรมและกฎหมาย ท่านสามารถขอให้เราลบบัญชีของท่านได้ทุกเมื่อ (ดูหัวข้อ \"สิทธิของท่าน\" ด้านล่าง)",
      ],
    },
    {
      heading: "สิทธิของท่าน",
      body: [
        "ภายใต้ PDPA ท่านมีสิทธิเข้าถึง แก้ไข ลบ หรือขอสำเนาข้อมูลส่วนบุคคลของท่าน และมีสิทธิถอนความยินยอมได้ทุกเมื่อ การถอนความยินยอมจะไม่กระทบต่อการดำเนินการใด ๆ ที่เราทำไปแล้วก่อนการถอนความยินยอมนั้น",
        "หากต้องการใช้สิทธิดังกล่าว กรุณาใช้ปุ่ม Contact us บนเว็บไซต์นี้ และเราจะตอบกลับโดยเร็วที่สุดเท่าที่จะทำได้",
      ],
    },
    {
      heading: "คุกกี้และการจดจำอุปกรณ์",
      body: [
        "เราใช้คุกกี้ที่จำเป็นอย่างยิ่งเพียงไม่กี่รายการ ได้แก่ คุกกี้สำหรับคงสถานะการเข้าสู่ระบบของท่าน และ (เฉพาะกรณีใช้รหัสผ่านร่วมของรุ่นเรียน) คุกกี้ที่ช่วยให้จดจำอุปกรณ์เฉพาะของท่านเมื่อกลับมาใช้งานอีกครั้ง เราไม่ใช้คุกกี้เพื่อการโฆษณาหรือติดตามพฤติกรรม",
      ],
    },
    {
      heading: "การเปลี่ยนแปลงนโยบายนี้",
      body: [
        "หากเรามีการเปลี่ยนแปลงนโยบายนี้อย่างมีนัยสำคัญ เราจะขอความยินยอมจากผู้ลงทะเบียนใหม่สำหรับฉบับปรับปรุงต่อจากนี้ไป โดยจะไม่ขอให้บัญชีที่มีอยู่แล้วต้องยอมรับซ้ำย้อนหลัง",
      ],
    },
    {
      heading: "ติดต่อเรา",
      body: [
        "หากมีข้อสงสัยเกี่ยวกับนโยบายนี้หรือข้อมูลส่วนบุคคลของท่าน กรุณาใช้ปุ่ม Contact us ที่มีอยู่ทั่วทั้งเว็บไซต์นี้",
      ],
    },
  ],
};

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<"en" | "th">("en");
  const copy = lang === "en" ? EN : TH;

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            HADA Aesthetic Training
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
            {lang === "en" ? "Privacy policy" : "นโยบายความเป็นส่วนตัว"}
          </h1>
          <p className="mt-2 text-xs text-muted">
            {lang === "en" ? "Last updated" : "ปรับปรุงล่าสุด"} {LAST_UPDATED} &middot;{" "}
            {lang === "en" ? "Version" : "เวอร์ชัน"} {POLICY_VERSION}
          </p>
        </div>

        <div className="flex shrink-0 gap-1 rounded-full border border-ink/15 bg-card p-1">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              lang === "en" ? "bg-teal text-porcelain" : "text-muted hover:text-ink"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("th")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              lang === "th" ? "bg-teal text-porcelain" : "text-muted hover:text-ink"
            }`}
          >
            ไทย
          </button>
        </div>
      </div>

      <div className="mt-8 max-w-2xl">
        {copy.intro.map((paragraph, i) => (
          <p key={i} className="mb-4 text-sm leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}

        <div className="mt-6 flex flex-col gap-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-lg text-ink">{section.heading}</h2>
              <ul className="mt-2.5 flex flex-col gap-2">
                {section.body.map((line, i) => (
                  <li key={i} className="text-sm leading-relaxed text-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted">
          {lang === "en" ? (
            <>Back to <Link href="/" className="font-medium text-teal hover:underline">home</Link>.</>
          ) : (
            <>กลับสู่<Link href="/" className="font-medium text-teal hover:underline">หน้าแรก</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
