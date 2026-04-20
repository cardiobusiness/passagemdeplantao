import Link from "next/link";
import { PatientForm } from "@/components/PatientForm";
import { ProtectedShell } from "@/components/ProtectedShell";
import { getBeds } from "@/lib/api";
import styles from "@/components/dashboard-shell.module.css";

type Props = {
  searchParams?: {
    bedId?: string;
  };
};

export default async function NewPatientPage({ searchParams }: Props) {
  const beds = await getBeds();
  const availableBeds = beds.filter((bed) => !bed.occupied).map((bed) => ({ id: bed.id, code: bed.code }));
  const preferredBedId = Number(searchParams?.bedId);
  const selectedBedId =
    Number.isInteger(preferredBedId) && availableBeds.some((bed) => bed.id === preferredBedId)
      ? preferredBedId
      : null;

  return (
    <ProtectedShell routeKey="patientCreate">
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className="pill">Cadastro individualizado</span>
            <h1>Novo paciente do CTI</h1>
            <p>
              Tela inicial para admissao, vinculacao de leito e registro do perfil
              respiratorio e motor do paciente.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.linkButton} href="/dashboard">
              Voltar ao painel
            </Link>
          </div>
        </header>

        <PatientForm availableBeds={availableBeds} preferredBedId={selectedBedId} />
      </section>
    </ProtectedShell>
  );
}
