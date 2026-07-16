import HomeApplication from "../components/home/HomeApplication";
import ResultDetailSanitizer from "../components/results/ResultDetailSanitizer";
import BepcSubjectDetailsCompactEnhancer from "../components/results/BepcSubjectDetailsCompactEnhancer";

export default function HomePage() {
  return (
    <>
      <HomeApplication />
      <ResultDetailSanitizer />
      <BepcSubjectDetailsCompactEnhancer />
    </>
  );
}
