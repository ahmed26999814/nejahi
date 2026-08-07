import BacAlertRegistration from "../../../components/alerts/BacAlertRegistration";

export const metadata = {
  title: "أخبرني عند صدور نتائج الامتياز 2026",
  description: "سجّل اسمك ورقم واتساب للحصول على إشعار فور صدور نتائج الامتياز 2026 الرسمية في موريتانيا عبر MauriResults.",
  alternates: {
    canonical: "/notify/excellence-2026",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ExcellenceAlertPage() {
  return (
    <BacAlertRegistration
      examSlug="excellence-2026"
      examTitle="نتائج الامتياز 2026"
      resultHref="/results/excellence/2026"
    />
  );
}
