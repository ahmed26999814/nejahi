import "./admin-results.css";
import FastResultsUploadApplication from "../../../components/admin/results/FastResultsUploadApplication";
import SiteControlPanel from "../../../components/admin/results/SiteControlPanel";

export default function ResultsUploadPage() {
  return (
    <div className="admin-results-route">
      <FastResultsUploadApplication />
      <div className="admin-results-controls-wrap">
        <SiteControlPanel />
      </div>
    </div>
  );
}
