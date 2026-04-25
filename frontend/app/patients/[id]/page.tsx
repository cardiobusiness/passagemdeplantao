import Link from "next/link";
import { notFound } from "next/navigation";
import { PatientClinicalForm } from "@/components/PatientClinicalForm";
import { ProtectedShell } from "@/components/ProtectedShell";
import { getServerPatient } from "@/lib/server-api";
import { Patient } from "@/lib/types";
import { formatVentilatorySupport, isMechanicalVentilationType } from "@/lib/ventilatorySupport";
import styles from "./patient-detail.module.css";

type Props = {
  params: {
    id: string;
  };
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sem registro.";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getCurrentStatus(patient: Patient) {
  if (patient.discharge) {
    return `Saida registrada: ${patient.discharge.type}`;
  }

  return isMechanicalVentilationType(patient.ventilatorySupport.type) || patient.mechanicalVentilation
    ? "Internado em suporte ventilatorio"
    : "Internado em acompanhamento fisioterapeutico";
}

function getChestXray(imaging: Patient["imaging"]) {
  return imaging.filter((exam) => exam.type.toLowerCase().includes("rx") || exam.type.toLowerCase().includes("radio"));
}

function getOtherImaging(imaging: Patient["imaging"]) {
  return imaging.filter((exam) => !exam.type.toLowerCase().includes("rx") && !exam.type.toLowerCase().includes("radio"));
}

function renderList(items: string[]) {
  return items.length ? items.join(" - ") : "Sem registro.";
}

function renderMetric(value: number | null, unit = "dias") {
  if (value === null) {
    return "Sem registro.";
  }

  return `${value} ${unit}`;
}

function getBedLabel(patient: Patient) {
  return patient.bedCode ?? patient.lastBedCode ?? "Sem leito ativo";
}

const labFieldLabels = [
  ["hb", "HB"],
  ["ht", "HT"],
  ["leuco", "Leuco"],
  ["bt", "BT"],
  ["plq", "PLQ"],
  ["ur", "Ur"],
  ["cr", "Cr"],
  ["pcr", "PCR"],
  ["na", "Na"],
  ["k", "K"],
  ["ca", "Ca"],
  ["ac", "Ac"]
] as const;

const shiftObservationLines = Array.from({ length: 5 }, (_, index) => index);

function renderFilterClass(patient: Patient) {
  if (patient.filterStatus.isOverdue) {
    return styles.filterOverdue;
  }

  if (patient.filterStatus.isPreventive) {
    return styles.filterPreventive;
  }

  return styles.filterOk;
}

export default async function PatientDetailPage({ params }: Props) {
  const patientId = Number(params.id);

  if (!Number.isInteger(patientId)) {
    notFound();
  }

  let patient: Patient;

  try {
    patient = await getServerPatient(patientId);
  } catch {
    notFound();
  }

  const chestXray = getChestXray(patient.imaging);
  const otherImaging = getOtherImaging(patient.imaging);

  return (
    <ProtectedShell routeKey="patients">
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className="pill">CTI 1 - {patient.bedId ? getBedLabel(patient) : "Historico de paciente"}</span>
            <h1>{patient.name}</h1>
            <p>{patient.diagnosis}</p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.linkButton} href="/patients">
              Voltar aos pacientes
            </Link>
            {patient.bedId ? (
              <Link className={styles.primaryButton} href={`/dashboard?patientId=${patient.id}#discharge`}>
                Alta / Saida
              </Link>
            ) : null}
          </div>
        </header>

        <section className={styles.heroGrid}>
          <article id="identificacao" className={`${styles.heroCard} card`}>
            <div className={styles.sectionHeader}>
              <h2>Identificacao</h2>
              <span className="pill">{getCurrentStatus(patient)}</span>
            </div>
            <div className={styles.identityGrid}>
              <div>
                <span>Prontuario</span>
                <strong>{patient.recordNumber}</strong>
              </div>
              <div>
                <span>Idade</span>
                <strong>{patient.age} anos</strong>
              </div>
              <div>
                <span>Leito</span>
                <strong>{patient.bedId ? getBedLabel(patient) : patient.lastBedCode ?? "Sem leito ativo"}</strong>
              </div>
              <div>
                <span>Admissao</span>
                <strong>{formatDate(patient.admissionDate)}</strong>
              </div>
              <div>
                <span>Dias de internacao no CTI</span>
                <strong>{renderMetric(patient.stayMetrics?.ctiDays ?? null)}</strong>
              </div>
              <div>
                <span>Status atual</span>
                <strong>{getCurrentStatus(patient)}</strong>
              </div>
            </div>
            <p className={styles.summaryText}>
              <strong>Diagnostico principal:</strong> {patient.diagnosis}
            </p>
            <p className={styles.summaryText}>
              <strong>Motivo da internacao:</strong> {patient.reasonForAdmission}
            </p>
          </article>

          <article className={`${styles.actionCard} card`}>
            <div className={styles.sectionHeader}>
              <h2>Acoes disponiveis</h2>
            </div>
            <div className={styles.actionGrid}>
              <a className={styles.actionButton} href="#identificacao">
                Editar paciente
              </a>
              <a className={styles.actionButton} href="#ficha-clinica">
                Ficha clinica
              </a>
              <a className={styles.actionButton} href="#ventilacao">
                Registrar ventilacao
              </a>
              <a className={styles.actionButton} href="#evolucao">
                Registrar evolucao
              </a>
              <Link className={styles.actionButtonStrong} href={`/dashboard?patientId=${patient.id}#discharge`}>
                Alta / Saida
              </Link>
            </div>
          </article>
        </section>

        <div id="ficha-clinica">
          <PatientClinicalForm patient={patient} />
        </div>

        <div className={styles.detailGrid}>
          <section id="exames" className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Indicadores temporais e filtro</h2>
            </div>
            <div className={styles.identityGrid}>
              <div>
                <span>Dias de internacao hospitalar</span>
                <strong>{renderMetric(patient.stayMetrics?.hospitalDays ?? null)}</strong>
              </div>
              <div>
                <span>Dias de internacao no CTI</span>
                <strong>{renderMetric(patient.stayMetrics?.ctiDays ?? null)}</strong>
              </div>
              <div>
                <span>Dias de ventilacao mecanica</span>
                <strong>{renderMetric(patient.stayMetrics?.mechanicalVentilationDays ?? null)}</strong>
              </div>
              <div>
                <span>Dias de IOT</span>
                <strong>{renderMetric(patient.stayMetrics?.iotDays ?? null)}</strong>
              </div>
              <div>
                <span>Dias de TQT</span>
                <strong>{renderMetric(patient.stayMetrics?.tqtDays ?? null)}</strong>
              </div>
              <div>
                <span>Tempo de extubacao</span>
                <strong>
                  {patient.stayMetrics?.extubationHours !== null && patient.stayMetrics?.extubationHours !== undefined
                    ? `${patient.stayMetrics.extubationHours} horas`
                    : "Sem registro."}
                </strong>
              </div>
              <div>
                <span>Ultima troca de filtro</span>
                <strong>{formatDateTime(patient.filterStatus.lastFilterChangeDateTime)}</strong>
              </div>
              <div>
                <span>Proxima troca do filtro</span>
                <strong>{formatDateTime(patient.filterStatus.nextFilterChangeDateTime)}</strong>
              </div>
              <div className={styles.fullRow}>
                <span>Status do filtro</span>
                <strong className={`${styles.filterIndicator} ${renderFilterClass(patient)}`}>
                  {patient.filterStatus.label}
                </strong>
              </div>
              <div className={styles.fullRow}>
                <span>Alertas respiratorios</span>
                <strong>{renderList(patient.respiratoryAlerts)}</strong>
              </div>
            </div>
          </section>

          <section className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Historico clinico</h2>
            </div>
            <div className={styles.stack}>
              <article className={styles.infoBlock}>
                <span>Antecedentes</span>
                <p>{renderList(patient.clinicalHistory.antecedentes)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Comorbidades</span>
                <p>{renderList(patient.clinicalHistory.comorbidities)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Intercorrencias</span>
                <p>{renderList(patient.clinicalHistory.intercurrences)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Alertas clinicos</span>
                <p>{renderList(patient.clinicalHistory.clinicalAlerts)}</p>
              </article>
            </div>
          </section>

          <section id="ventilacao" className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Ventilacao mecanica</h2>
            </div>
            {patient.mechanicalVentilation ? (
              <div className={styles.identityGrid}>
                <div><span>Tipo de suporte</span><strong>{patient.mechanicalVentilation.typeOfSupport}</strong></div>
                <div><span>Via aerea</span><strong>{patient.mechanicalVentilation.airway}</strong></div>
                <div><span>TOT/TQT</span><strong>{patient.mechanicalVentilation.totTqt}</strong></div>
                <div><span>Modo ventilatorio</span><strong>{patient.ventilatorParameters.mode || patient.mechanicalVentilation.ventilatoryMode}</strong></div>
                <div><span>FiO2</span><strong>{patient.ventilatorParameters.fio2 || patient.mechanicalVentilation.fio2}</strong></div>
                <div><span>PEEP</span><strong>{patient.ventilatorParameters.peep || patient.mechanicalVentilation.peep}</strong></div>
                <div><span>Volume corrente</span><strong>{patient.ventilatorParameters.tidalVolume || patient.mechanicalVentilation.tidalVolume}</strong></div>
                <div><span>Pressao suporte</span><strong>{patient.ventilatorParameters.pressureSupport || patient.mechanicalVentilation.inspiratoryPressure}</strong></div>
                <div><span>FR programada</span><strong>{patient.ventilatorParameters.respiratoryRate || patient.mechanicalVentilation.programmedRespiratoryRate}</strong></div>
                <div><span>Saturacao alvo</span><strong>{patient.ventilatorParameters.targetSaturation || "Sem registro."}</strong></div>
                <div className={styles.fullRow}>
                  <span>Observacoes</span>
                  <strong>{patient.mechanicalVentilation.observations || "Sem observacoes."}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.empty}>Paciente sem ventilacao mecanica registrada no momento.</p>
            )}
          </section>

          <section className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Restricoes</h2>
            </div>
            <div className={styles.stack}>
              <article className={styles.infoBlock}>
                <span>Restricoes motoras</span>
                <p>{renderList(patient.restrictions.motor)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Restricoes respiratorias</span>
                <p>{renderList(patient.restrictions.respiratory)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Restricoes de mobilizacao</span>
                <p>{renderList(patient.restrictions.mobilization)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Isolamento</span>
                <p>{patient.restrictions.isolation}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Contraindicacoes</span>
                <p>{renderList(patient.restrictions.contraindications)}</p>
              </article>
            </div>
          </section>

          <section className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Exames complementares</h2>
            </div>
            <div className={styles.stack}>
              <article className={styles.infoBlock}>
                <span>Exames laboratoriais</span>
                {patient.labs.length ? (
                  patient.labs.map((lab) => (
                    <div key={lab.id} className={styles.labRecord}>
                      <strong>{lab.date}</strong>
                      <div className={styles.labGrid}>
                        {labFieldLabels.map(([field, label]) => (
                          <div key={`${lab.id}-${field}`} className={styles.labCell}>
                            <span>{label}</span>
                            <strong>{lab[field] || "-"}</strong>
                          </div>
                        ))}
                        <div className={`${styles.labCell} ${styles.labExtra}`}>
                          <span>Exame extra</span>
                          <strong>
                            {lab.extraExamName
                              ? `${lab.extraExamName}: ${lab.extraExamValue || "-"}`
                              : "Sem exame extra"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Sem exames laboratoriais registrados.</p>
                )}
              </article>
              <article className={styles.infoBlock}>
                <span>Gasometria arterial</span>
                {patient.bloodGas.length ? (
                  patient.bloodGas.map((exam, index) => (
                    <p key={`${exam.date}-${index}`}>
                      {exam.date} - pH {exam.ph} | PaO2 {exam.pao2} | PaCO2 {exam.paco2} | HCO3 {exam.hco3}
                    </p>
                  ))
                ) : (
                  <p>Sem gasometria registrada.</p>
                )}
              </article>
              <article className={styles.infoBlock}>
                <span>Radiografia de torax</span>
                {chestXray.length ? (
                  chestXray.map((exam, index) => (
                    <p key={`${exam.type}-${exam.date}-${index}`}>{exam.date} - {exam.result}</p>
                  ))
                ) : (
                  <p>Sem radiografia registrada.</p>
                )}
              </article>
              <article className={styles.infoBlock}>
                <span>Tomografia e outros exames</span>
                {[...patient.complementaryExams.tomography, ...patient.complementaryExams.other, ...otherImaging].length ? (
                  [...patient.complementaryExams.tomography, ...patient.complementaryExams.other, ...otherImaging].map((exam, index) => (
                    <p key={`${exam.type}-${exam.date}-${index}`}>{exam.date} - {exam.type}: {exam.result}</p>
                  ))
                ) : (
                  <p>Sem tomografia ou outros exames registrados.</p>
                )}
              </article>
            </div>
          </section>

          <section id="evolucao" className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Evolucao fisioterapeutica</h2>
            </div>
            <div className={styles.stack}>
              <article className={styles.infoBlock}>
                <span>Evolucao respiratoria</span>
                <p>{patient.physiotherapyPlan.respiratoryEvolution}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Evolucao motora</span>
                <p>{patient.physiotherapyPlan.motorEvolution}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Condutas</span>
                <p>{renderList(patient.physiotherapyPlan.conducts)}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Resposta do paciente</span>
                <p>{patient.physiotherapyPlan.patientResponse}</p>
              </article>
              <article className={styles.infoBlock}>
                <span>Registros recentes</span>
                {patient.evolutions.length ? (
                  patient.evolutions.map((evolution, index) => (
                    <p key={`${evolution.date}-${index}`}>
                      {evolution.date} - {evolution.type} - {evolution.professional}: {evolution.note}
                    </p>
                  ))
                ) : (
                  <p>Sem evolucoes fisioterapeuticas registradas.</p>
                )}
              </article>
            </div>
          </section>

          <section className={`${styles.section} ${styles.notesSection} card`}>
            <div className={styles.sectionHeader}>
              <h2>Observacoes do Plantao</h2>
            </div>
            <p className={styles.notesIntro}>
              {patient.clinicalNotes || "Espaco destinado a anotacoes manuais durante a passagem de plantao impressa."}
            </p>
            <div className={styles.notesLines} aria-hidden="true">
              {shiftObservationLines.map((line) => (
                <div key={`shift-note-line-${line}`} className={styles.noteLine} />
              ))}
            </div>
          </section>
        </div>

        {patient.discharge ? (
          <section className={`${styles.section} card`}>
            <div className={styles.sectionHeader}>
              <h2>Historico de saida</h2>
            </div>
            <div className={styles.identityGrid}>
              <div><span>Tipo</span><strong>{patient.discharge.type}</strong></div>
              <div><span>Data e hora</span><strong>{formatDateTime(patient.discharge.dateTime)}</strong></div>
              <div className={styles.fullRow}>
                <span>Observacao</span>
                <strong>{patient.discharge.note || "Sem observacao."}</strong>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </ProtectedShell>
  );
}
