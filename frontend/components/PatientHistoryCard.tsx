import { Patient } from "@/lib/types";
import styles from "./PatientHistoryCard.module.css";

type Props = {
  patients: Patient[];
};

export function PatientHistoryCard({ patients }: Props) {
  const recentPatients = [...patients].slice(-4).reverse();

  return (
    <section className={`${styles.card} card`}>
      <h2>Historico recente</h2>
      <div className={styles.patientList}>
        {recentPatients.map((patient) => (
          <article key={patient.id} className={styles.patientItem}>
            <strong>{patient.name}</strong>
            <p>{patient.diagnosis}</p>
            <p>
              Prontuario {patient.recordNumber} • Leito{" "}
              {String(patient.bedId ?? patient.lastBedId ?? 0).padStart(2, "0")}
            </p>
            <p>
              Respiratorio: {patient.ventilatorySupport} • Motor: {patient.mobilityLevel}
            </p>
            <p>
              {patient.discharge
                ? `Saida registrada: ${patient.discharge.type}`
                : "Paciente internado em CTI 1"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
