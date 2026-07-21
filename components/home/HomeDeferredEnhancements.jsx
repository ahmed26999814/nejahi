"use client";

import dynamic from "next/dynamic";

const MotivationalVisibility = dynamic(
  () => import("../ui/MotivationalVisibility"),
  { ssr: false },
);
const BacTopperTrackOrder = dynamic(
  () => import("../ui/BacTopperTrackOrder"),
  { ssr: false },
);
const ResultSubjectDetailsBridge = dynamic(
  () => import("../results/ResultSubjectDetailsBridge"),
  { ssr: false },
);
const ResultDetailSanitizer = dynamic(
  () => import("../results/ResultDetailSanitizer"),
  { ssr: false },
);
const OrientationResultBridge = dynamic(
  () => import("../orientation/OrientationResultBridge"),
  { ssr: false },
);

export default function HomeDeferredEnhancements() {
  return (
    <>
      <MotivationalVisibility />
      <BacTopperTrackOrder />
      <ResultSubjectDetailsBridge />
      <ResultDetailSanitizer />
      <OrientationResultBridge />
    </>
  );
}
