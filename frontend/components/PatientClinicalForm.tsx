"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePatientClinicalData } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Patient, PatientBloodGas, PatientImaging, PatientLab, VentilatorySupport } from "@/lib/types";
import { createEmptyVentilatorySupport, normalizeVentilatorySupportType, VENTILATORY_SUPPORT_OPTIONS } from "@/lib/ventilatorySupport";
import styles from "./PatientClinicalForm.module.css";

type Props = {
  patient: Patient;
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60000);
  return normalized.toISOString().slice(0, 16);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sem registro";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function addThreeDays(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + 3);
  return date.toISOString();
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function emptyLab(): PatientLab {
  return {
    id: Date.now(),
    date: "",
    hb: "",
    ht: "",
    leuco: "",
    bt: "",
    plq: "",
    ur: "",
    cr: "",
    pcr: "",
    na: "",
    k: "",
    ca: "",
    ac: "",
    extraExamName: "",
    extraExamValue: ""
  };
}

function emptyImaging(type = ""): PatientImaging {
  return {
    date: "",
    type,
    result: ""
  };
}

function emptyBloodGas(): PatientBloodGas {
  return {
    date: "",
    ph: "",
    pao2: "",
    paco2: "",
    hco3: ""
  };
}

export function PatientClinicalForm({ patient }: Props) {
  const router = useRouter();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [ventilatorySupport, setVentilatorySupport] = useState<VentilatorySupport>(patient.ventilatorySupport ?? createEmptyVentilatorySupport(""));
  const [mechanicalVentilation, setMechanicalVentilation] = useState({
    typeOfSupport: patient.mechanicalVentilation?.typeOfSupport ?? "",
    airway: patient.mechanicalVentilation?.airway ?? "",
    totTqt: patient.mechanicalVentilation?.totTqt ?? "",
    ventilatoryMode: patient.mechanicalVentilation?.ventilatoryMode ?? "",
    fio2: patient.mechanicalVentilation?.fio2 ?? "",
    peep: patient.mechanicalVentilation?.peep ?? "",
    tidalVolume: patient.mechanicalVentilation?.tidalVolume ?? "",
    inspiratoryPressure: patient.mechanicalVentilation?.inspiratoryPressure ?? "",
    programmedRespiratoryRate: patient.mechanicalVentilation?.programmedRespiratoryRate ?? "",
    cuff: patient.mechanicalVentilation?.cuff ?? "",
    observations: patient.mechanicalVentilation?.observations ?? ""
  });
  const [ventilatorParameters, setVentilatorParameters] = useState(patient.ventilatorParameters);
  const [restrictions, setRestrictions] = useState({
    motor: joinLines(patient.restrictions.motor),
    respiratory: joinLines(patient.restrictions.respiratory),
    mobilization: joinLines(patient.restrictions.mobilization),
    isolation: patient.restrictions.isolation,
    contraindications: joinLines(patient.restrictions.contraindications)
  });
  const [labs, setLabs] = useState<PatientLab[]>(patient.labs.length ? patient.labs : [emptyLab()]);
  const [imaging, setImaging] = useState<PatientImaging[]>(patient.imaging.length ? patient.imaging : [emptyImaging("Radiografia")]);
  const [bloodGas, setBloodGas] = useState<PatientBloodGas[]>(
    patient.complementaryExams.bloodGas.length ? patient.complementaryExams.bloodGas : [emptyBloodGas()]
  );
  const [tomography, setTomography] = useState<PatientImaging[]>(
    patient.complementaryExams.tomography.length ? patient.complementaryExams.tomography : [emptyImaging("Tomografia")]
  );
  const [otherExams, setOtherExams] = useState<PatientImaging[]>(
    patient.complementaryExams.other.length ? patient.complementaryExams.other : [emptyImaging("Outro")]
  );
  const [ventilatoryFilterChange, setVentilatoryFilterChange] = useState(
    toDateTimeLocal(patient.filterChanges.ventilatoryFilter.lastChangeDateTime)
  );
  const [trachCareChange, setTrachCareChange] = useState(
    toDateTimeLocal(patient.filterChanges.trachCare.lastChangeDateTime)
  );
  const [conducts, setConducts] = useState(joinLines(patient.physiotherapyPlan.conducts));
  const [clinicalNotes, setClinicalNotes] = useState(patient.clinicalNotes ?? "");
  const [updatedBy, setUpdatedBy] = useState(storedUser?.name ?? patient.clinicalUpdatedBy ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(patient.clinicalUpdatedAt);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>(patient.clinicalUpdatedBy);

  function updateListItem<T extends object>(list: T[], index: number, field: keyof T, value: string) {
    const next = [...list];
    next[index] = { ...next[index], [field]: value };
    return next;
  }

  function updateSupportField(field: keyof VentilatorySupport, value: string) {
    const numericFields = [
      "flowRate",
      "fio2",
      "temperature",
      "ipap",
      "epap",
      "peep",
      "tidalVolume",
      "respiratoryRate",
      "pressureSupport",
      "targetSaturation"
    ];

    setVentilatorySupport((current) => {
      if (field === "type") {
        const supportType = normalizeVentilatorySupportType(value);
        return {
          ...createEmptyVentilatorySupport(supportType),
          type: supportType
        };
      }

      return {
        ...current,
        [field]: numericFields.includes(field as string) ? (value ? Number(value) : null) : value
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedPatient = await updatePatientClinicalData(patient.id, {
        ventilatorySupport,
        mechanicalVentilation,
        ventilatorParameters,
        restrictions: {
          motor: splitLines(restrictions.motor),
          respiratory: splitLines(restrictions.respiratory),
          mobilization: splitLines(restrictions.mobilization),
          isolation: restrictions.isolation,
          contraindications: splitLines(restrictions.contraindications)
        },
        labs: labs.filter((lab) => lab.date || lab.hb || lab.pcr || lab.cr || lab.extraExamName),
        imaging: imaging.filter((exam) => exam.date || exam.type || exam.result),
        complementaryExams: {
          bloodGas: bloodGas.filter((exam) => exam.date || exam.ph || exam.pao2 || exam.paco2 || exam.hco3),
          tomography: tomography.filter((exam) => exam.date || exam.type || exam.result),
          other: otherExams.filter((exam) => exam.date || exam.type || exam.result)
        },
        filterChanges: {
          ventilatoryFilter: { lastChangeDateTime: ventilatoryFilterChange || null },
          trachCare: { lastChangeDateTime: trachCareChange || null }
        },
        clinicalNotes,
        conducts: splitLines(conducts),
        updatedBy
      });

      setLastUpdatedAt(updatedPatient.clinicalUpdatedAt);
      setLastUpdatedBy(updatedPatient.clinicalUpdatedBy);
      setMessage("Alteracoes clinicas salvas com sucesso.");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel salvar os dados clinicos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${styles.card} card`}>
      <div className={styles.header}>
        <div>
          <h2>Ficha clinica editavel</h2>
          <p>Atualize ventilacao, parametros, restricoes, exames, filtros e observacoes sem perder o historico existente.</p>
        </div>
        <div className={styles.meta}>
          {lastUpdatedAt ? (
            <>
              <span>Ultima alteracao em: {formatDateTime(lastUpdatedAt)}</span>
              <span>Alterado por: {lastUpdatedBy || "Nao informado"}</span>
            </>
          ) : (
            <span>Sem alteracoes registradas</span>
          )}
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h3>Ventilacao e parametros</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="ventilatorySupportType">Tipo de suporte ventilatorio</label>
              <select id="ventilatorySupportType" value={ventilatorySupport.type} onChange={(event) => updateSupportField("type", event.target.value)}>
                <option value="">Nao informado</option>
                {VENTILATORY_SUPPORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {ventilatorySupport.type === "cateter_nasal" ? (
              <div className={styles.field}>
                <label htmlFor="flowRate">Litragem (L/min)</label>
                <input id="flowRate" type="number" min="0" value={ventilatorySupport.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
              </div>
            ) : null}

            {ventilatorySupport.type === "venturi" ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="venturiFlow">Fluxo (L/min)</label>
                  <input id="venturiFlow" type="number" min="0" value={ventilatorySupport.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="venturiFio2">FiO2 (%)</label>
                  <input id="venturiFio2" type="number" min="0" value={ventilatorySupport.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
                </div>
              </>
            ) : null}

            {ventilatorySupport.type === "alto_fluxo" ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="hfncFlow">Fluxo (L/min)</label>
                  <input id="hfncFlow" type="number" min="0" value={ventilatorySupport.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="hfncFio2">FiO2 (%)</label>
                  <input id="hfncFio2" type="number" min="0" value={ventilatorySupport.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="temperature">Temperatura</label>
                  <input id="temperature" type="number" min="0" value={ventilatorySupport.temperature ?? ""} onChange={(event) => updateSupportField("temperature", event.target.value)} />
                </div>
              </>
            ) : null}

            {ventilatorySupport.type === "macronebulizacao" ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="macroFlow">Fluxo (L/min)</label>
                  <input id="macroFlow" type="number" min="0" value={ventilatorySupport.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="solution">Solucao</label>
                  <input id="solution" value={ventilatorySupport.solution ?? ""} onChange={(event) => updateSupportField("solution", event.target.value)} />
                </div>
              </>
            ) : null}

            {ventilatorySupport.type === "vni" ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="mode">Modo</label>
                  <select id="mode" value={ventilatorySupport.mode ?? ""} onChange={(event) => updateSupportField("mode", event.target.value)}>
                    <option value="">Selecione</option>
                    <option value="CPAP">CPAP</option>
                    <option value="BIPAP">BIPAP</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="ipap">IPAP</label>
                  <input id="ipap" type="number" min="0" value={ventilatorySupport.ipap ?? ""} onChange={(event) => updateSupportField("ipap", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="epap">EPAP</label>
                  <input id="epap" type="number" min="0" value={ventilatorySupport.epap ?? ""} onChange={(event) => updateSupportField("epap", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="vniFio2">FiO2 (%)</label>
                  <input id="vniFio2" type="number" min="0" value={ventilatorySupport.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
                </div>
              </>
            ) : null}

            {ventilatorySupport.type === "vmi" ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="vmiMode">Modo ventilatorio</label>
                  <input id="vmiMode" value={ventilatorySupport.mode ?? ""} onChange={(event) => updateSupportField("mode", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="tidalVolume">Volume corrente</label>
                  <input id="tidalVolume" type="number" min="0" value={ventilatorySupport.tidalVolume ?? ""} onChange={(event) => updateSupportField("tidalVolume", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="respiratoryRate">Frequencia respiratoria</label>
                  <input id="respiratoryRate" type="number" min="0" value={ventilatorySupport.respiratoryRate ?? ""} onChange={(event) => updateSupportField("respiratoryRate", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="peep">PEEP</label>
                  <input id="peep" type="number" min="0" value={ventilatorySupport.peep ?? ""} onChange={(event) => updateSupportField("peep", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="fio2">FiO2 (%)</label>
                  <input id="fio2" type="number" min="0" value={ventilatorySupport.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="pressureSupport">Pressao suporte</label>
                  <input id="pressureSupport" type="number" min="0" value={ventilatorySupport.pressureSupport ?? ""} onChange={(event) => updateSupportField("pressureSupport", event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="targetSaturation">Saturacao alvo</label>
                  <input id="targetSaturation" type="number" min="0" value={ventilatorySupport.targetSaturation ?? ""} onChange={(event) => updateSupportField("targetSaturation", event.target.value)} />
                </div>
              </>
            ) : null}

            <div className={styles.field}>
              <label htmlFor="typeOfSupport">Tipo de ventilacao</label>
              <input id="typeOfSupport" value={mechanicalVentilation.typeOfSupport} onChange={(event) => setMechanicalVentilation((current) => ({ ...current, typeOfSupport: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="airway">Via aerea</label>
              <input id="airway" value={mechanicalVentilation.airway} onChange={(event) => setMechanicalVentilation((current) => ({ ...current, airway: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="totTqt">TOT / TQT</label>
              <input id="totTqt" value={mechanicalVentilation.totTqt} onChange={(event) => setMechanicalVentilation((current) => ({ ...current, totTqt: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="modeParameters">Modo complementar</label>
              <input id="modeParameters" value={ventilatorParameters.mode} onChange={(event) => setVentilatorParameters((current) => ({ ...current, mode: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="fio2Parameters">FiO2 complementar</label>
              <input id="fio2Parameters" value={ventilatorParameters.fio2} onChange={(event) => setVentilatorParameters((current) => ({ ...current, fio2: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="peepParameters">PEEP complementar</label>
              <input id="peepParameters" value={ventilatorParameters.peep} onChange={(event) => setVentilatorParameters((current) => ({ ...current, peep: event.target.value }))} />
            </div>
            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="ventObservations">Observacoes ventilatorias</label>
              <textarea id="ventObservations" rows={3} value={mechanicalVentilation.observations} onChange={(event) => setMechanicalVentilation((current) => ({ ...current, observations: event.target.value }))} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Restricoes</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="motor">Restricoes motoras</label>
              <textarea id="motor" rows={4} value={restrictions.motor} onChange={(event) => setRestrictions((current) => ({ ...current, motor: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="respiratory">Restricoes respiratorias</label>
              <textarea id="respiratory" rows={4} value={restrictions.respiratory} onChange={(event) => setRestrictions((current) => ({ ...current, respiratory: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="mobilization">Restricoes de mobilizacao</label>
              <textarea id="mobilization" rows={4} value={restrictions.mobilization} onChange={(event) => setRestrictions((current) => ({ ...current, mobilization: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="isolation">Isolamento</label>
              <input id="isolation" value={restrictions.isolation} onChange={(event) => setRestrictions((current) => ({ ...current, isolation: event.target.value }))} />
            </div>
            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="contraindications">Contraindicacoes</label>
              <textarea id="contraindications" rows={4} value={restrictions.contraindications} onChange={(event) => setRestrictions((current) => ({ ...current, contraindications: event.target.value }))} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.rowHeader}>
            <h3>Laboratorio</h3>
            <button className={styles.button} type="button" onClick={() => setLabs((current) => [...current, emptyLab()])}>
              Adicionar laboratorio
            </button>
          </div>
          <div className={styles.rowList}>
            {labs.map((lab, index) => (
              <div key={`lab-${index}`} className={styles.rowCard}>
                <div className={styles.grid}>
                  <div className={styles.field}><label>Data</label><input type="date" value={lab.date} onChange={(event) => setLabs((current) => updateListItem(current, index, "date", event.target.value))} /></div>
                  <div className={styles.field}><label>HB</label><input value={lab.hb} onChange={(event) => setLabs((current) => updateListItem(current, index, "hb", event.target.value))} /></div>
                  <div className={styles.field}><label>PCR</label><input value={lab.pcr} onChange={(event) => setLabs((current) => updateListItem(current, index, "pcr", event.target.value))} /></div>
                  <div className={styles.field}><label>Creatinina</label><input value={lab.cr} onChange={(event) => setLabs((current) => updateListItem(current, index, "cr", event.target.value))} /></div>
                  <div className={styles.field}><label>Exame extra</label><input value={lab.extraExamName} onChange={(event) => setLabs((current) => updateListItem(current, index, "extraExamName", event.target.value))} /></div>
                  <div className={styles.field}><label>Valor</label><input value={lab.extraExamValue} onChange={(event) => setLabs((current) => updateListItem(current, index, "extraExamValue", event.target.value))} /></div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.dangerButton} type="button" onClick={() => setLabs((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.rowHeader}>
            <h3>Radiografia / imagem</h3>
            <button className={styles.button} type="button" onClick={() => setImaging((current) => [...current, emptyImaging()])}>
              Adicionar imagem
            </button>
          </div>
          <div className={styles.rowList}>
            {imaging.map((exam, index) => (
              <div key={`imaging-${index}`} className={styles.rowCard}>
                <div className={styles.grid}>
                  <div className={styles.field}><label>Data</label><input type="date" value={exam.date} onChange={(event) => setImaging((current) => updateListItem(current, index, "date", event.target.value))} /></div>
                  <div className={styles.field}><label>Tipo</label><input value={exam.type} onChange={(event) => setImaging((current) => updateListItem(current, index, "type", event.target.value))} /></div>
                  <div className={`${styles.field} ${styles.full}`}><label>Resultado</label><textarea rows={3} value={exam.result} onChange={(event) => setImaging((current) => updateListItem(current, index, "result", event.target.value))} /></div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.dangerButton} type="button" onClick={() => setImaging((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.rowHeader}>
            <h3>Gasometria e exames complementares</h3>
          </div>
          <div className={styles.rowHeader}>
            <h4>Gasometria</h4>
            <button className={styles.button} type="button" onClick={() => setBloodGas((current) => [...current, emptyBloodGas()])}>
              Adicionar gasometria
            </button>
          </div>
          <div className={styles.rowList}>
            {bloodGas.map((exam, index) => (
              <div key={`gas-${index}`} className={styles.rowCard}>
                <div className={styles.grid}>
                  <div className={styles.field}><label>Data</label><input type="date" value={exam.date} onChange={(event) => setBloodGas((current) => updateListItem(current, index, "date", event.target.value))} /></div>
                  <div className={styles.field}><label>pH</label><input value={exam.ph} onChange={(event) => setBloodGas((current) => updateListItem(current, index, "ph", event.target.value))} /></div>
                  <div className={styles.field}><label>PaO2</label><input value={exam.pao2} onChange={(event) => setBloodGas((current) => updateListItem(current, index, "pao2", event.target.value))} /></div>
                  <div className={styles.field}><label>PaCO2</label><input value={exam.paco2} onChange={(event) => setBloodGas((current) => updateListItem(current, index, "paco2", event.target.value))} /></div>
                  <div className={styles.field}><label>HCO3</label><input value={exam.hco3} onChange={(event) => setBloodGas((current) => updateListItem(current, index, "hco3", event.target.value))} /></div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.dangerButton} type="button" onClick={() => setBloodGas((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.rowHeader}>
            <h4>Tomografia</h4>
            <button className={styles.button} type="button" onClick={() => setTomography((current) => [...current, emptyImaging("Tomografia")])}>
              Adicionar tomografia
            </button>
          </div>
          <div className={styles.rowList}>
            {tomography.map((exam, index) => (
              <div key={`tomography-${index}`} className={styles.rowCard}>
                <div className={styles.grid}>
                  <div className={styles.field}><label>Data</label><input type="date" value={exam.date} onChange={(event) => setTomography((current) => updateListItem(current, index, "date", event.target.value))} /></div>
                  <div className={styles.field}><label>Tipo</label><input value={exam.type} onChange={(event) => setTomography((current) => updateListItem(current, index, "type", event.target.value))} /></div>
                  <div className={`${styles.field} ${styles.full}`}><label>Resultado</label><textarea rows={3} value={exam.result} onChange={(event) => setTomography((current) => updateListItem(current, index, "result", event.target.value))} /></div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.dangerButton} type="button" onClick={() => setTomography((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.rowHeader}>
            <h4>Outros</h4>
            <button className={styles.button} type="button" onClick={() => setOtherExams((current) => [...current, emptyImaging("Outro")])}>
              Adicionar exame
            </button>
          </div>
          <div className={styles.rowList}>
            {otherExams.map((exam, index) => (
              <div key={`other-${index}`} className={styles.rowCard}>
                <div className={styles.grid}>
                  <div className={styles.field}><label>Data</label><input type="date" value={exam.date} onChange={(event) => setOtherExams((current) => updateListItem(current, index, "date", event.target.value))} /></div>
                  <div className={styles.field}><label>Tipo</label><input value={exam.type} onChange={(event) => setOtherExams((current) => updateListItem(current, index, "type", event.target.value))} /></div>
                  <div className={`${styles.field} ${styles.full}`}><label>Resultado</label><textarea rows={3} value={exam.result} onChange={(event) => setOtherExams((current) => updateListItem(current, index, "result", event.target.value))} /></div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.dangerButton} type="button" onClick={() => setOtherExams((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3>Troca de filtros</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="ventFilter">Ultima troca do filtro ventilatorio</label>
              <input id="ventFilter" type="datetime-local" value={ventilatoryFilterChange} onChange={(event) => setVentilatoryFilterChange(event.target.value)} />
              <div className={styles.statusRow}>
                <span>Proxima troca: {formatDateTime(addThreeDays(ventilatoryFilterChange))}</span>
                <span>Status: {addThreeDays(ventilatoryFilterChange) && new Date(addThreeDays(ventilatoryFilterChange) as string).getTime() < Date.now() ? "Vencido" : "Em dia"}</span>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="trachCare">Ultima troca do TrachCare</label>
              <input id="trachCare" type="datetime-local" value={trachCareChange} onChange={(event) => setTrachCareChange(event.target.value)} />
              <div className={styles.statusRow}>
                <span>Proxima troca: {formatDateTime(addThreeDays(trachCareChange))}</span>
                <span>Status: {addThreeDays(trachCareChange) && new Date(addThreeDays(trachCareChange) as string).getTime() < Date.now() ? "Vencido" : "Em dia"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Condutas e observacoes</h3>
          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="conducts">Condutas terapeuticas</label>
              <textarea id="conducts" rows={4} value={conducts} onChange={(event) => setConducts(event.target.value)} />
            </div>
            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="clinicalNotes">Observacoes clinicas e dados livres</label>
              <textarea id="clinicalNotes" rows={6} value={clinicalNotes} onChange={(event) => setClinicalNotes(event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="updatedBy">Profissional responsavel</label>
              <input id="updatedBy" value={updatedBy} onChange={(event) => setUpdatedBy(event.target.value)} />
            </div>
          </div>
        </section>

        {message ? <p className={styles.message}>{message}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <span className={styles.statusRow}>Os campos existentes sao preservados quando nao enviados.</span>
          <button className={styles.submit} type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alteracoes clinicas"}
          </button>
        </div>
      </form>
    </section>
  );
}
