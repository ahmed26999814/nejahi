import { permanentRedirect } from "next/navigation";

export const metadata = {
  title: "نتائج باكالوريا موريتانيا 2026",
  robots: {
    index: false,
    follow: true,
  },
};

export default function BacAlertPage() {
  permanentRedirect("/results/bac/2026");
}
