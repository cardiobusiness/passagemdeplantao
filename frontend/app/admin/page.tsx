import { AdminUsersPage } from "@/components/AdminUsersPage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function AdminPage() {
  return (
    <ProtectedShell routeKey="admin">
      <AdminUsersPage />
    </ProtectedShell>
  );
}
