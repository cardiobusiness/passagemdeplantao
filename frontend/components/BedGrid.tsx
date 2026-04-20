import Link from "next/link";
import { Bed } from "@/lib/types";
import styles from "./BedGrid.module.css";

type Props = {
  beds: Bed[];
};

export function BedGrid({ beds }: Props) {
  return (
    <div className={styles.grid}>
      {beds.map((bed) => {
        const stateClass = !bed.occupied
          ? styles.vacant
          : bed.alertCount > 0 || bed.status === "Atencao"
            ? styles.attention
            : styles.occupied;
        const href = bed.patient ? `/patients/${bed.patient.id}` : `/patients/new?bedId=${bed.id}`;

        return (
          <Link key={bed.id} href={href} className={styles.linkCard}>
            <article className={`${styles.card} ${stateClass}`}>
              <div className={styles.head}>
                <div>
                  <strong>{bed.code}</strong>
                  <span>{bed.sector}</span>
                </div>
                {bed.alertCount > 0 ? <div className={styles.alertBadge}>{bed.alertCount}</div> : null}
              </div>

              <div className={styles.content}>
                <span className={styles.status}>{bed.status}</span>
                {bed.patient ? (
                  <>
                    <strong>{bed.patient.name}</strong>
                    <p>{bed.patient.diagnosis}</p>
                    <p>Suporte: {bed.patient.ventilatorySupport}</p>
                    <div className={styles.metrics}>
                      <span>Hospital {bed.patient.stayMetrics.hospitalDays ?? "-"}d</span>
                      <span>CTI {bed.patient.stayMetrics.ctiDays ?? "-"}d</span>
                      {bed.patient.stayMetrics.mechanicalVentilationDays ? (
                        <span>VM {bed.patient.stayMetrics.mechanicalVentilationDays}d</span>
                      ) : null}
                    </div>
                    {bed.patient.filterStatus.status !== "nao_aplicavel" ? (
                      <div
                        className={`${styles.filterBadge} ${
                          bed.patient.filterStatus.isOverdue
                            ? styles.filterOverdue
                            : bed.patient.filterStatus.isPreventive
                              ? styles.filterPreventive
                              : styles.filterOk
                        }`}
                      >
                        {bed.patient.filterStatus.label}
                      </div>
                    ) : null}
                    <span className={styles.cta}>Abrir ficha clinica</span>
                  </>
                ) : (
                  <>
                    <strong>Leito disponivel</strong>
                    <p>Aguardando nova admissao.</p>
                    <span className={styles.cta}>Cadastrar novo paciente</span>
                  </>
                )}
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
