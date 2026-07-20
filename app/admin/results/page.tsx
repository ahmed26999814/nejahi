import "./admin-results.css";
import "./site-controls.css";
import "./published-results.css";
import "./dashboard.css";
import AdminSecretStorageBridge from "../../../components/admin/AdminSecretStorageBridge";
import AdminResultsDashboard from "../../../components/admin/results/AdminResultsDashboard";

export default function ResultsUploadPage() {
  return (
    <div className="admin-results-route">
      <AdminSecretStorageBridge>
        <AdminResultsDashboard />
      </AdminSecretStorageBridge>
    </div>
  );
}
