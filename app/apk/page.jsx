import { redirect } from "next/navigation";

export const metadata = {
  title: "MauriResults — الموقع الرسمي",
  description: "تم الاستغناء عن تطبيق APK. استخدم الموقع مباشرة لمتابعة نتائج الامتحانات.",
  robots: { index: false, follow: true },
};

export default function DeprecatedApkPage() {
  redirect("/");
}
