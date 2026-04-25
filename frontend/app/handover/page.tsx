import { ProtectedShell } from "@/components/ProtectedShell";
import { HandoverPrintPage } from "@/components/HandoverPrintPage";
import { getServerBeds, getServerPatients } from "@/lib/server-api";

export default async function HandoverPage() {
  const [beds, patients] = await Promise.all([getServerBeds(), getServerPatients()]);

  return (
    <ProtectedShell routeKey="handover">
      <HandoverPrintPage beds={beds} patients={patients} />
    </ProtectedShell>
  );
}
