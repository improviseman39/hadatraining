import { redirect } from "next/navigation";

// Curriculum browsing and the member dashboard are now one page — see
// src/app/curriculum/page.tsx, which shows progress/continue-watching
// inline for a logged-in member instead of sending them to a separate
// destination. This route stays as a redirect in case anything links here.
export default function MyLearningPage() {
  redirect("/curriculum");
}
