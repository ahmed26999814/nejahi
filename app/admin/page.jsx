import AdminSecretStorageBridge from "../../components/admin/AdminSecretStorageBridge";
import ContentAdminApplication from "../../components/admin/ContentAdminApplication";

export default function AdminPage() {
  return (
    <AdminSecretStorageBridge>
      <ContentAdminApplication />
    </AdminSecretStorageBridge>
  );
}
