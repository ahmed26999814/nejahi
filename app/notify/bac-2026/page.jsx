import BacAlertRegistration from "../../../components/alerts/BacAlertRegistration";

export const metadata = {
  title: "أخبرني عند صدور نتائج باكالوريا 2026",
  description: "سجّل اسمك ورقم واتساب للحصول على إشعار فور صدور نتائج باكالوريا 2026 الرسمية في موريتانيا عبر MauriResults.",
  alternates: {
    canonical: "/notify/bac-2026",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function BacAlertPage() {
  return <BacAlertRegistration />;
}
