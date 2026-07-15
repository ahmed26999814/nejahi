import HomeApplication from "../components/home/HomeApplication";
import ResultsCountdownBanner from "../components/home/ResultsCountdownBanner";
import ResultDetailSanitizer from "../components/results/ResultDetailSanitizer";

export default function HomePage() {
  return (
    <>
      <ResultsCountdownBanner />
      <HomeApplication />
      <ResultDetailSanitizer />
    </>
  );
}
