import { ProtectedShell } from "@/components/ProtectedShell";
import { SectorsAdminPage } from "@/components/SectorsAdminPage";

export default function SectorsPage() {
  return (
    <ProtectedShell routeKey="admin">
      <SectorsAdminPage />
    </ProtectedShell>
  );
}
