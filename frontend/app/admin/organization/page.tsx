import { OrganizationAdminPage } from "@/components/OrganizationAdminPage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function OrganizationPage() {
  return (
    <ProtectedShell routeKey="admin">
      <OrganizationAdminPage />
    </ProtectedShell>
  );
}
