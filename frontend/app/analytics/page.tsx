import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { ProtectedShell } from "@/components/ProtectedShell";
import { getBeds, getMonthlyDashboard, getPatients } from "@/lib/api";

export default async function AnalyticsPage() {
  const [beds, patients, dashboard] = await Promise.all([
    getBeds(),
    getPatients(),
    getMonthlyDashboard()
  ]);

  return (
    <ProtectedShell routeKey="analytics">
      <AnalyticsDashboard beds={beds} patients={patients} dashboard={dashboard} />
    </ProtectedShell>
  );
}
