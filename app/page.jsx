import "./forgot-number.css";
import "./keyboard-mobile.css";
import HomeApplication from "../components/home/HomeApplication";
import Bac2026CountdownNotice from "../components/layout/Bac2026CountdownNotice";
import KeyboardViewportGuard from "../components/layout/KeyboardViewportGuard";
import PublicDataFetchBridge from "../components/layout/PublicDataFetchBridge";
import OrientationResultBridge from "../components/orientation/OrientationResultBridge";
import ResultDetailSanitizer from "../components/results/ResultDetailSanitizer";
import ResultSubjectDetailsBridge from "../components/results/ResultSubjectDetailsBridge";
import BacTopperTrackOrder from "../components/ui/BacTopperTrackOrder";
import MotivationalVisibility from "../components/ui/MotivationalVisibility";

export default function HomePage() {
  return (
    <>
      <Bac2026CountdownNotice />
      <PublicDataFetchBridge />
      <KeyboardViewportGuard />
      <MotivationalVisibility />
      <BacTopperTrackOrder />
      <ResultSubjectDetailsBridge />
      <HomeApplication />
      <ResultDetailSanitizer />
      <OrientationResultBridge />
    </>
  );
}
