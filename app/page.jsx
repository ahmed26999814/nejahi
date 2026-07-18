import "./forgot-number.css";
import "./keyboard-mobile.css";
import HomeApplication from "../components/home/HomeApplication";
import KeyboardViewportGuard from "../components/layout/KeyboardViewportGuard";
import ResultDetailSanitizer from "../components/results/ResultDetailSanitizer";

export default function HomePage() {
  return (
    <>
      <KeyboardViewportGuard />
      <HomeApplication />
      <ResultDetailSanitizer />
    </>
  );
}
