import { BedsAdminPage } from "@/components/BedsAdminPage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function BedsPage() {
  return (
    <ProtectedShell routeKey="admin">
      <BedsAdminPage />
    </ProtectedShell>
  );
}
