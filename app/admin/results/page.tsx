import "./admin-results.css";
import "./site-controls.css";
import "./published-results.css";
import FastResultsUploadApplication from "../../../components/admin/results/FastResultsUploadApplication";
import SiteControlPanel from "../../../components/admin/results/SiteControlPanel";
import PublishedResultsManager from "../../../components/admin/results/PublishedResultsManager";

export default function ResultsUploadPage() {
  return (
    <div className="admin-results-route">
      <FastResultsUploadApplication />
      <div className="admin-results-controls-wrap">
        <PublishedResultsManager />
        <SiteControlPanel />
      </div>
    </div>
  );
}
