import Link from "next/link";
import AdminSecretStorageBridge from "../../components/admin/AdminSecretStorageBridge";
import ContentAdminApplication from "../../components/admin/ContentAdminApplication";

export default function AdminPage() {
  return (
    <AdminSecretStorageBridge>
      <>
        <Link
          href="/admin/alerts"
          className="fixed left-3 top-3 z-[70] inline-flex min-h-11 items-center justify-center rounded-2xl bg-mauri-green px-4 text-xs font-black text-white shadow-[0_12px_32px_rgba(21,128,61,.28)] transition active:scale-[.97]"
        >
          طلبات إشعار باكالوريا
        </Link>
        <ContentAdminApplication />
      </>
    </AdminSecretStorageBridge>
  );
}
