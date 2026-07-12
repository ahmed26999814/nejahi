import HomeApplication from "../components/home/HomeApplication";
import ResultDetailSanitizer from "../components/results/ResultDetailSanitizer";
import AdsterraAds from "../components/ads/AdsterraAds";

export default function HomePage() {
  return (
    <>
      <HomeApplication />
      <AdsterraAds />
      <ResultDetailSanitizer />
    </>
  );
}
