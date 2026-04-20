import Link from "next/link";
import { BedGrid } from "@/components/BedGrid";
import { PatientDischargeCard } from "@/components/PatientDischargeCard";
import { PatientForm } from "@/components/PatientForm";
import { PatientHistoryCard } from "@/components/PatientHistoryCard";
import { PatientLabsModule } from "@/components/PatientLabsModule";
import { ProtectedShell } from "@/components/ProtectedShell";
import { getBeds, getMonthlyDashboard, getPatients } from "@/lib/api";
import styles from "@/components/dashboard-shell.module.css";

type Props = {
  searchParams?: {
    patientId?: string;
  };
};

export default async function DashboardPage({ searchParams }: Props) {
  const [beds, dashboard, patients] = await Promise.all([
    getBeds(),
    getMonthlyDashboard(),
    getPatients()
  ]);

  const availableBeds = beds
    .filter((bed) => !bed.occupied)
    .map((bed) => ({ id: bed.id, code: bed.code }));
  const activePatients = patients.filter((patient) => patient.bedId !== null);
  const queryPatientId = Number(searchParams?.patientId);
  const initialPatientId =
    Number.isInteger(queryPatientId) && patients.some((patient) => patient.id === queryPatientId)
      ? queryPatientId
      : null;
  const highlightedAlerts = activePatients
    .filter((patient) => patient.alerts.length > 0)
    .slice(0, 4);

  return (
    <ProtectedShell routeKey="dashboard">
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className="pill">{dashboard.month}</span>
            <h1>Passagem de Plantao</h1>
            <p>
              Gestao Inteligente de CTI com monitoramento integrado dos 40 leitos,
              fluxo assistencial, exames e alertas de condutas prioritarias.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.primaryButton} href="/patients/new">
              Novo paciente
            </Link>
          </div>
        </header>

        <section className={styles.summaryGrid}>
          <article className={`${styles.summaryCard} card`}>
            <span>Taxa de ocupacao</span>
            <strong>{dashboard.occupancyRate}%</strong>
            <small>40 leitos monitorados</small>
          </article>
          <article className={`${styles.summaryCard} card`}>
            <span>Alertas ativos</span>
            <strong>{dashboard.activeAlerts}</strong>
            <small>Prioridades automaticas</small>
          </article>
          <article className={`${styles.summaryCard} card`}>
            <span>Evolucoes do mes</span>
            <strong>{dashboard.respiratoryEvolutions + dashboard.motorEvolutions}</strong>
            <small>
              Respiratoria {dashboard.respiratoryEvolutions} | Motora {dashboard.motorEvolutions}
            </small>
          </article>
        </section>

        <div className={styles.grid}>
          <section className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Mapa de leitos</h2>
                <span className="pill">Atualizacao em tempo real preparada</span>
              </div>
            </div>
            <BedGrid beds={beds} />
          </section>

          <div className={styles.rightColumn}>
            <PatientForm availableBeds={availableBeds} />
            <PatientDischargeCard patients={patients} initialPatientId={initialPatientId} />
            <PatientLabsModule patients={activePatients} initialPatientId={initialPatientId} />

            <section className={`${styles.section} card`}>
              <div className={styles.sectionHeader}>
                <h2>Alertas prioritarios</h2>
              </div>
              <div className={styles.list}>
                {highlightedAlerts.length ? (
                  highlightedAlerts.map((patient) => (
                    <article key={patient.id} className={styles.listItem}>
                      <strong>{patient.name}</strong>
                      <p>{patient.alerts[0]}</p>
                      <div className={styles.statusRow}>
                        <span>Leito {String(patient.bedId).padStart(2, "0")}</span>
                        <span>{patient.ventilatorySupport}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className={styles.empty}>Nenhum alerta critico neste momento.</p>
                )}
              </div>
            </section>

            <PatientHistoryCard patients={patients} />
          </div>
        </div>
      </section>
    </ProtectedShell>
  );
}
