import AdminSecretStorageBridge from "../../../components/admin/AdminSecretStorageBridge";
import ResultAlertsAdmin from "../../../components/admin/ResultAlertsAdmin";

export const metadata = {
  title: "طلبات إشعار باكالوريا",
  robots: { index: false, follow: false },
};

export default function ResultAlertsAdminPage() {
  return (
    <AdminSecretStorageBridge>
      <ResultAlertsAdmin />
    </AdminSecretStorageBridge>
  );
}
