import { ProtectedShell } from "@/components/ProtectedShell";
import { HandoverPrintPage } from "@/components/HandoverPrintPage";
import { getBeds, getPatients } from "@/lib/api";

export default async function HandoverPage() {
  const [beds, patients] = await Promise.all([getBeds(), getPatients()]);

  return (
    <ProtectedShell routeKey="handover">
      <HandoverPrintPage beds={beds} patients={patients} />
    </ProtectedShell>
  );
}
