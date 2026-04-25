"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dischargePatient } from "@/lib/api";
import { Patient } from "@/lib/types";
import styles from "./PatientDischargeCard.module.css";

type Props = {
  patients: Patient[];
  initialPatientId?: number | null;
};

const dischargeOptions = [
  { value: "casa", label: "Alta para casa" },
  { value: "quarto", label: "Alta para quarto" },
  { value: "transferencia", label: "Transferencia" },
  { value: "obito", label: "Obito / Celestial" }
];

const initialForm = {
  patientId: "",
  type: "casa",
  dateTime: "",
  notes: "",
  roomNumber: "",
  destination: ""
};

function formatPatientStatus(patient: Patient) {
  if (patient.discharge) {
    return `Saida: ${patient.discharge.type}`;
  }

  if (patient.bedCode) {
    return `Internado no leito ${patient.bedCode}`;
  }

  return "Sem leito ativo";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function formatDischargeDestination(patient: Patient) {
  if (!patient.discharge?.destination) {
    return null;
  }

  if (patient.discharge.type === "quarto") {
    const room = patient.discharge.destination.roomNumber;
    return room ? `Quarto ${room}` : null;
  }

  if (patient.discharge.type === "transferencia") {
    return patient.discharge.destination.destination ?? null;
  }

  return null;
}

export function PatientDischargeCard({ patients, initialPatientId = null }: Props) {
  const router = useRouter();
  const activePatients = useMemo(
    () => patients.filter((patient) => patient.bedId !== null),
    [patients]
  );
  const [form, setForm] = useState(initialForm);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => {
      if (field === "patientId") {
        const patient = activePatients.find((currentPatient) => currentPatient.id === Number(value)) ?? null;
        setSelectedPatient(patient);

        return {
          ...current,
          patientId: value,
          dateTime: current.dateTime || new Date().toISOString().slice(0, 16)
        };
      }

      if (field === "type") {
        return {
          ...current,
          type: value,
          roomNumber: "",
          destination: ""
        };
      }

      return { ...current, [field]: value };
    });
  }

  function handleSelectPatient(patient: Patient) {
    console.log("clicou alta");
    setSelectedPatient(patient);
    setHighlightForm(true);
    setForm((current) => ({
      ...current,
      patientId: String(patient.id),
      dateTime: current.dateTime || new Date().toISOString().slice(0, 16)
    }));
    setMessage("");
    setError("");

    window.setTimeout(() => {
      document.getElementById("discharge")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 0);

    window.setTimeout(() => {
      setHighlightForm(false);
    }, 1800);
  }

  const preferredActivePatientId =
    initialPatientId && activePatients.some((patient) => patient.id === initialPatientId)
      ? String(initialPatientId)
      : "";

  useEffect(() => {
    if (!form.patientId && preferredActivePatientId) {
      const patient = activePatients.find((currentPatient) => currentPatient.id === Number(preferredActivePatientId)) ?? null;
      setSelectedPatient(patient);
      setForm((current) => ({
        ...current,
        patientId: preferredActivePatientId,
        dateTime: current.dateTime || new Date().toISOString().slice(0, 16)
      }));
    }
  }, [form.patientId, preferredActivePatientId]);

  function validateForm() {
    if (!form.patientId || !form.type || !form.dateTime.trim()) {
      return "Preencha paciente, tipo de saida e data/hora.";
    }

    if (form.type === "quarto" && !form.roomNumber.trim()) {
      return "Informe o numero do quarto de destino.";
    }

    if (form.type === "transferencia" && !form.destination.trim()) {
      return "Informe o destino da transferencia.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const currentPatient = activePatients.find((patient) => patient.id === Number(form.patientId));

    if (!currentPatient) {
      setError("Selecione um paciente internado.");
      return;
    }

    const confirmed = window.confirm(
      `Confirmar a saida de ${currentPatient.name} com o tipo "${form.type}"?`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      console.log("confirmando alta");
      await dischargePatient(Number(form.patientId), {
        type: form.type as "casa" | "quarto" | "transferencia" | "obito",
        dateTime: form.dateTime,
        notes: form.notes.trim(),
        roomNumber: form.roomNumber.trim(),
        destination: form.destination.trim()
      });

      setMessage("Saida do paciente registrada com sucesso.");
      setForm(initialForm);
      setSelectedPatient(null);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Nao foi possivel registrar a saida."
      );
    } finally {
      setSaving(false);
    }
  }

  const recentPatients = [...patients].slice(-6).reverse();

  return (
    <section
      id="discharge"
      className={`${styles.card} card ${highlightForm ? styles.formHighlight : ""}`}
    >
      <div className={styles.header}>
        <div>
          <h2>Alta / Saida</h2>
          <p>Finalize a internacao liberando o leito sem perder o historico do paciente.</p>
        </div>
        <span className="pill">{activePatients.length} internados</span>
      </div>

      {activePatients.length ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="discharge-patient">Paciente</label>
            <select
              id="discharge-patient"
              value={form.patientId}
              onChange={(event) => updateField("patientId", event.target.value)}
            >
              <option value="">Selecione um paciente</option>
              {activePatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.bedCode ?? "Sem leito ativo"}
                </option>
              ))}
            </select>
          </div>

          {selectedPatient ? (
            <div className={`${styles.field} ${styles.full}`}>
              <label>Paciente selecionado</label>
              <input value={`${selectedPatient.name} - ${selectedPatient.bedCode ?? "Sem leito ativo"}`} readOnly />
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="discharge-type">Tipo de saida</label>
            <select
              id="discharge-type"
              value={form.type}
              onChange={(event) => updateField("type", event.target.value)}
            >
              {dischargeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="discharge-date-time">Data e hora</label>
            <input
              id="discharge-date-time"
              type="datetime-local"
              value={form.dateTime}
              onChange={(event) => updateField("dateTime", event.target.value)}
            />
          </div>

          {form.type === "quarto" ? (
            <div className={styles.field}>
              <label htmlFor="discharge-room-number">Numero do quarto</label>
              <input
                id="discharge-room-number"
                value={form.roomNumber}
                onChange={(event) => updateField("roomNumber", event.target.value)}
                placeholder="Ex.: 302"
              />
            </div>
          ) : null}

          {form.type === "transferencia" ? (
            <div className={styles.field}>
              <label htmlFor="discharge-destination">Destino</label>
              <input
                id="discharge-destination"
                value={form.destination}
                onChange={(event) => updateField("destination", event.target.value)}
                placeholder="Hospital, unidade ou servico de destino"
              />
            </div>
          ) : null}

          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="discharge-note">Observacoes</label>
            <textarea
              id="discharge-note"
              rows={3}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Observacao clinica opcional sobre a saida."
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.submit} type="submit" disabled={saving}>
              {saving ? "Confirmando..." : "Confirmar alta / saida"}
            </button>
          </div>
        </form>
      ) : (
        <p className={styles.empty}>Nenhum paciente internado no momento.</p>
      )}

      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.list}>
        {recentPatients.map((patient) => (
          <article key={patient.id} className={styles.patientItem}>
            <div className={styles.patientHead}>
              <strong>{patient.name}</strong>
              <span className={patient.discharge ? styles.discharged : styles.active}>
                {patient.discharge ? "Saida registrada" : "Internado"}
              </span>
            </div>
            <p>{patient.diagnosis}</p>
            <p>{formatPatientStatus(patient)}</p>
            {patient.discharge ? (
              <>
                <p>Data/hora: {formatDateTime(patient.discharge.dateTime)}</p>
                {formatDischargeDestination(patient) ? (
                  <p>Destino: {formatDischargeDestination(patient)}</p>
                ) : null}
                <p>Observacao: {patient.discharge.note || "Sem observacao."}</p>
              </>
            ) : (
              <div className={styles.patientActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => handleSelectPatient(patient)}
                >
                  Alta / Saida
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
