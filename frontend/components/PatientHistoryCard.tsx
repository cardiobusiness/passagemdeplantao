import { Patient } from "@/lib/types";
import { formatVentilatorySupport } from "@/lib/ventilatorySupport";
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
            <p>Prontuario {patient.recordNumber} - {patient.bedCode ?? patient.lastBedCode ?? "Sem leito ativo"}</p>
            <p>Respiratorio: {formatVentilatorySupport(patient.ventilatorySupport)} - Motor: {patient.mobilityLevel}</p>
            <p>{patient.discharge ? `Saida registrada: ${patient.discharge.type}` : "Paciente internado em CTI 1"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
