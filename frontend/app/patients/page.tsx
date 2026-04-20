import Link from "next/link";
import { ProtectedShell } from "@/components/ProtectedShell";
import { getPatients } from "@/lib/api";
import styles from "./patients-page.module.css";

export default async function PatientsPage() {
  const patients = await getPatients();
  const admittedPatients = patients.filter((patient) => patient.bedId !== null);
  const dischargedPatients = patients.filter((patient) => patient.bedId === null).slice(0, 6);

  return (
    <ProtectedShell routeKey="patients">
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className="pill">Area clinica</span>
            <h1>Pacientes</h1>
            <p>Consulta rapida da ficha clinica, leito atual e principais tempos assistenciais do CTI.</p>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Pacientes internados</h2>
            <span>{admittedPatients.length} em acompanhamento</span>
          </div>

          <div className={styles.grid}>
            {admittedPatients.map((patient) => (
              <article key={patient.id} className={`${styles.card} card`}>
                <div className={styles.cardHeader}>
                  <div>
                    <strong>{patient.name}</strong>
                    <span>{patient.recordNumber}</span>
                  </div>
                  <span className="pill">{patient.bedId ? `L${100 + patient.bedId}` : "Sem leito"}</span>
                </div>

                <div className={styles.meta}>
                  <span>{patient.age} anos</span>
                  <span>{patient.diagnosis}</span>
                  <span>CTI: {patient.stayMetrics.ctiDays ?? 0} dias</span>
                  <span>VM: {patient.stayMetrics.mechanicalVentilationDays ?? 0} dias</span>
                </div>

                <p className={styles.summary}>{patient.reasonForAdmission}</p>

                <div className={styles.actions}>
                  <Link href={`/patients/${patient.id}`} className={styles.primaryButton}>
                    Abrir ficha
                  </Link>
                  <Link href="/handover" className={styles.secondaryButton}>
                    Passagem
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Historico recente</h2>
            <span>{dischargedPatients.length} pacientes com alta ou saida</span>
          </div>

          <div className={styles.grid}>
            {dischargedPatients.length ? (
              dischargedPatients.map((patient) => (
                <article key={patient.id} className={`${styles.card} card`}>
                  <div className={styles.cardHeader}>
                    <div>
                      <strong>{patient.name}</strong>
                      <span>{patient.recordNumber}</span>
                    </div>
                    <span className="pill">Historico</span>
                  </div>

                  <div className={styles.meta}>
                    <span>{patient.discharge?.type || "Sem saida registrada"}</span>
                    <span>{patient.discharge?.dateTime || "Data nao informada"}</span>
                  </div>

                  <div className={styles.actions}>
                    <Link href={`/patients/${patient.id}`} className={styles.secondaryButton}>
                      Ver historico
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className={`${styles.emptyCard} card`}>
                Nenhum paciente com historico de saida no momento.
              </article>
            )}
          </div>
        </section>
      </section>
    </ProtectedShell>
  );
}
