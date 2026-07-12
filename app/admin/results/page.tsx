import "./admin-results.css";
import "./site-controls.css";
import "./published-results.css";
import "./dashboard.css";
import AdminResultsDashboard from "../../../components/admin/results/AdminResultsDashboard";

export default function ResultsUploadPage() {
  return (
    <div className="admin-results-route">
      <AdminResultsDashboard />
    </div>
  );
}
