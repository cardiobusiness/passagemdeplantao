import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { ProtectedShell } from "@/components/ProtectedShell";
import {
  emptyDashboard,
  getServerBeds,
  getServerMonthlyDashboard,
  getServerPatients
} from "@/lib/server-api";

export default async function AnalyticsPage() {
  const [bedsResult, patientsResult, dashboardResult] = await Promise.allSettled([
    getServerBeds(),
    getServerPatients(),
    getServerMonthlyDashboard()
  ]);
  const beds = bedsResult.status === "fulfilled" ? bedsResult.value : [];
  const patients = patientsResult.status === "fulfilled" ? patientsResult.value : [];
  const dashboard = dashboardResult.status === "fulfilled" ? dashboardResult.value : emptyDashboard;

  return (
    <ProtectedShell routeKey="analytics">
      <AnalyticsDashboard beds={beds} patients={patients} dashboard={dashboard} />
    </ProtectedShell>
  );
}
