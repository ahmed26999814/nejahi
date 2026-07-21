import "./forgot-number.css";
import "./keyboard-mobile.css";
import HomeApplication from "../components/home/HomeApplication";
import HomeDeferredEnhancements from "../components/home/HomeDeferredEnhancements";
import KeyboardViewportGuard from "../components/layout/KeyboardViewportGuard";
import PublicDataFetchBridge from "../components/layout/PublicDataFetchBridge";

export default function HomePage() {
  return (
    <>
      <PublicDataFetchBridge />
      <KeyboardViewportGuard />
      <HomeApplication />
      <HomeDeferredEnhancements />
    </>
  );
}
