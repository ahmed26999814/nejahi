import BacAlertRegistration from "../../../components/alerts/BacAlertRegistration";

export const metadata = {
  title: "أخبرني عند صدور نتائج باكالوريا الدورة التكميلية 2026",
  description: "سجّل اسمك ورقم واتساب للحصول على إشعار فور صدور نتائج باكالوريا الدورة التكميلية 2026 الرسمية في موريتانيا عبر MauriResults.",
  alternates: {
    canonical: "/notify/bac-session-2026",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function BacSessionAlertPage() {
  return (
    <BacAlertRegistration
      examSlug="bac-session-2026"
      examTitle="نتائج باكالوريا الدورة التكميلية 2026"
      resultHref="/results/bac-session/2026"
    />
  );
}
