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
  { value: "alta para casa", label: "Alta para casa" },
  { value: "transferencia para quarto", label: "Transferencia para quarto" },
  { value: "transferencia", label: "Transferencia" },
  { value: "obito", label: "Obito" }
];

const initialForm = {
  patientId: "",
  type: "alta para casa",
  dateTime: "",
  note: "",
  roomNumber: "",
  roomBed: "",
  destination: ""
};

function formatPatientStatus(patient: Patient) {
  if (patient.discharge) {
    return `Saida: ${patient.discharge.type}`;
  }

  return `Internado no leito ${String(patient.bedId ?? patient.lastBedId ?? 0).padStart(2, "0")}`;
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

  if (patient.discharge.type === "transferencia para quarto") {
    const room = patient.discharge.destination.roomNumber;
    const bed = patient.discharge.destination.roomBed;

    return bed ? `Quarto ${room}, leito ${bed}` : `Quarto ${room}`;
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => {
      if (field === "type") {
        return {
          ...current,
          type: value,
          roomNumber: "",
          roomBed: "",
          destination: ""
        };
      }

      return { ...current, [field]: value };
    });
  }

  function selectPatient(patientId: number) {
    setForm((current) => ({ ...current, patientId: String(patientId) }));
    setMessage("");
    setError("");
  }

  const preferredActivePatientId =
    initialPatientId && activePatients.some((patient) => patient.id === initialPatientId)
      ? String(initialPatientId)
      : "";

  useEffect(() => {
    if (!form.patientId && preferredActivePatientId) {
      setForm((current) => ({ ...current, patientId: preferredActivePatientId }));
    }
  }, [form.patientId, preferredActivePatientId]);

  function validateForm() {
    if (!form.patientId || !form.type || !form.dateTime.trim()) {
      return "Preencha paciente, tipo de saida e data/hora.";
    }

    if (form.type === "transferencia para quarto" && !form.roomNumber.trim()) {
      return "Informe o numero do quarto para transferencia para quarto.";
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

    const selectedPatient = activePatients.find((patient) => patient.id === Number(form.patientId));

    if (!selectedPatient) {
      setError("Selecione um paciente internado.");
      return;
    }

    const confirmed = window.confirm(
      `Confirmar a saida de ${selectedPatient.name} com o tipo "${form.type}"?`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      await dischargePatient(Number(form.patientId), {
        type: form.type,
        dateTime: form.dateTime,
        note: form.note.trim(),
        roomNumber: form.roomNumber.trim(),
        roomBed: form.roomBed.trim(),
        destination: form.destination.trim()
      });

      setMessage("Saida do paciente registrada com sucesso.");
      setForm(initialForm);
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
    <section id="discharge" className={`${styles.card} card`}>
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
                  {patient.name} - Leito {String(patient.bedId).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

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

          {form.type === "transferencia para quarto" ? (
            <>
              <div className={styles.field}>
                <label htmlFor="discharge-room-number">Numero do quarto</label>
                <input
                  id="discharge-room-number"
                  value={form.roomNumber}
                  onChange={(event) => updateField("roomNumber", event.target.value)}
                  placeholder="Ex.: 302"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="discharge-room-bed">Leito do quarto</label>
                <input
                  id="discharge-room-bed"
                  value={form.roomBed}
                  onChange={(event) => updateField("roomBed", event.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </>
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
            <label htmlFor="discharge-note">Observacao</label>
            <textarea
              id="discharge-note"
              rows={3}
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
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
                  onClick={() => selectPatient(patient.id)}
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
