import { permanentRedirect } from "next/navigation";

export default function LegacyBacMauritaniePage() {
  permanentRedirect("/results/bac/2026");
}
