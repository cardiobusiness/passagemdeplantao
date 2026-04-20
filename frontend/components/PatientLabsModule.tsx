"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPatientLab,
  deletePatientLab,
  getPatientLabs,
  updatePatientLab
} from "@/lib/api";
import { CreatePatientLabPayload, Patient, PatientLab } from "@/lib/types";
import styles from "./PatientLabsModule.module.css";

type Props = {
  patients: Patient[];
  initialPatientId?: number | null;
};

const initialForm: CreatePatientLabPayload & { patientId: string; editingLabId: string } = {
  patientId: "",
  editingLabId: "",
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

const fixedFields: Array<{ key: keyof CreatePatientLabPayload; label: string; placeholder: string }> = [
  { key: "hb", label: "HB", placeholder: "Ex.: 11,2" },
  { key: "ht", label: "HT", placeholder: "Ex.: 33%" },
  { key: "leuco", label: "Leuco", placeholder: "Ex.: 14.200/mm3" },
  { key: "bt", label: "BT (Bastoes)", placeholder: "Ex.: 6%" },
  { key: "plq", label: "PLQ", placeholder: "Ex.: 235.000/mm3" },
  { key: "ur", label: "Ur", placeholder: "Ex.: 41 mg/dL" },
  { key: "cr", label: "Cr", placeholder: "Ex.: 1,0 mg/dL" },
  { key: "pcr", label: "PCR", placeholder: "Ex.: 12 mg/L" },
  { key: "na", label: "Na", placeholder: "Ex.: 138 mEq/L" },
  { key: "k", label: "K", placeholder: "Ex.: 4,1 mEq/L" },
  { key: "ca", label: "Ca", placeholder: "Ex.: 8,8 mg/dL" },
  { key: "ac", label: "Ac (Lactato)", placeholder: "Ex.: 1,9 mmol/L" }
];

function mapLabToForm(lab: PatientLab, patientId: number) {
  return {
    patientId: String(patientId),
    editingLabId: String(lab.id),
    date: lab.date,
    hb: lab.hb,
    ht: lab.ht,
    leuco: lab.leuco,
    bt: lab.bt,
    plq: lab.plq,
    ur: lab.ur,
    cr: lab.cr,
    pcr: lab.pcr,
    na: lab.na,
    k: lab.k,
    ca: lab.ca,
    ac: lab.ac,
    extraExamName: lab.extraExamName,
    extraExamValue: lab.extraExamValue
  };
}

function getPayloadFromForm(form: typeof initialForm): CreatePatientLabPayload {
  return {
    date: form.date,
    hb: form.hb,
    ht: form.ht,
    leuco: form.leuco,
    bt: form.bt,
    plq: form.plq,
    ur: form.ur,
    cr: form.cr,
    pcr: form.pcr,
    na: form.na,
    k: form.k,
    ca: form.ca,
    ac: form.ac,
    extraExamName: form.extraExamName,
    extraExamValue: form.extraExamValue
  };
}

export function PatientLabsModule({ patients, initialPatientId = null }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [labs, setLabs] = useState<PatientLab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patients.length) {
      setLabs([]);
      return;
    }

    const preferredPatientId =
      initialPatientId && patients.some((patient) => patient.id === initialPatientId)
        ? String(initialPatientId)
        : String(patients[0].id);
    const defaultPatientId = form.patientId || preferredPatientId;

    if (defaultPatientId !== form.patientId) {
      setForm((current) => ({ ...current, patientId: defaultPatientId }));
      return;
    }

    let cancelled = false;

    async function loadLabs() {
      setLoadingLabs(true);
      setError("");

      try {
        const response = await getPatientLabs(Number(defaultPatientId));

        if (!cancelled) {
          setLabs(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setLabs([]);
          setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os exames.");
        }
      } finally {
        if (!cancelled) {
          setLoadingLabs(false);
        }
      }
    }

    loadLabs();

    return () => {
      cancelled = true;
    };
  }, [form.patientId, patients, initialPatientId]);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm(keepPatient = true) {
    setForm((current) => ({
      ...initialForm,
      patientId: keepPatient ? current.patientId : ""
    }));
  }

  function validateForm() {
    if (!form.patientId || !form.date.trim()) {
      return "Preencha paciente e data do registro.";
    }

    if (form.extraExamName.trim() && !form.extraExamValue.trim()) {
      return "Informe o valor do exame extra.";
    }

    if (!form.extraExamName.trim() && form.extraExamValue.trim()) {
      return "Informe o nome do exame extra.";
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

    setSaving(true);

    try {
      const payload = getPayloadFromForm(form);
      const patientId = Number(form.patientId);

      const savedLab = form.editingLabId
        ? await updatePatientLab(patientId, Number(form.editingLabId), payload)
        : await createPatientLab(patientId, payload);

      setLabs((current) => {
        const nextLabs = form.editingLabId
          ? current.map((lab) => (lab.id === savedLab.id ? savedLab : lab))
          : [savedLab, ...current];

        return nextLabs.sort((first, second) => second.date.localeCompare(first.date));
      });

      resetForm();
      setMessage(
        form.editingLabId
          ? "Registro laboratorial atualizado com sucesso."
          : "Registro laboratorial do dia salvo com sucesso."
      );
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Nao foi possivel salvar o registro laboratorial."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(labId: number) {
    setMessage("");
    setError("");

    const confirmed = window.confirm("Excluir este registro laboratorial diario?");

    if (!confirmed) {
      return;
    }

    try {
      await deletePatientLab(Number(form.patientId), labId);
      setLabs((current) => current.filter((lab) => lab.id !== labId));

      if (form.editingLabId === String(labId)) {
        resetForm();
      }

      setMessage("Registro laboratorial excluido com sucesso.");
      router.refresh();
    } catch (deletionError) {
      setError(
        deletionError instanceof Error
          ? deletionError.message
          : "Nao foi possivel excluir o registro laboratorial."
      );
    }
  }

  function handleEdit(lab: PatientLab) {
    setForm((current) => mapLabToForm(lab, Number(current.patientId)));
    setMessage("");
    setError("");
  }

  const selectedPatient = patients.find((patient) => patient.id === Number(form.patientId));

  return (
    <section id="labs" className={`${styles.card} card`}>
      <div className={styles.header}>
        <div>
          <h2>Exames laboratoriais diarios</h2>
          <p>Registre um painel laboratorial por data, com campos fixos e exame extra opcional.</p>
        </div>
        <span className="pill">{labs.length} dias registrados</span>
      </div>

      {!patients.length ? (
        <p className={styles.empty}>Cadastre um paciente para liberar o modulo de exames.</p>
      ) : (
        <>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="lab-patient">Paciente</label>
              <select
                id="lab-patient"
                value={form.patientId}
                onChange={(event) => updateField("patientId", event.target.value)}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - Leito {String(patient.bedId).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="lab-date">Data do registro</label>
              <input
                id="lab-date"
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </div>

            {fixedFields.map((field) => (
              <div key={field.key} className={styles.field}>
                <label htmlFor={`lab-${field.key}`}>{field.label}</label>
                <input
                  id={`lab-${field.key}`}
                  value={form[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className={styles.field}>
              <label htmlFor="lab-extra-name">Exame extra</label>
              <input
                id="lab-extra-name"
                value={form.extraExamName}
                onChange={(event) => updateField("extraExamName", event.target.value)}
                placeholder="Nome do exame"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="lab-extra-value">Valor do exame extra</label>
              <input
                id="lab-extra-value"
                value={form.extraExamValue}
                onChange={(event) => updateField("extraExamValue", event.target.value)}
                placeholder="Valor do exame"
              />
            </div>

            <div className={styles.actions}>
              {form.editingLabId ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => resetForm()}
                >
                  Cancelar edicao
                </button>
              ) : null}
              <button className={styles.submit} type="submit" disabled={saving}>
                {saving ? "Salvando..." : form.editingLabId ? "Atualizar registro" : "Salvar registro diario"}
              </button>
            </div>
          </form>

          {selectedPatient ? (
            <div className={styles.patientMeta}>
              <strong>{selectedPatient.name}</strong>
              <span>
                Prontuario {selectedPatient.recordNumber} | Suporte {selectedPatient.ventilatorySupport}
              </span>
            </div>
          ) : null}

          {message ? <p className={styles.message}>{message}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.list}>
            {loadingLabs ? (
              <p className={styles.empty}>Carregando exames...</p>
            ) : labs.length ? (
              labs.map((lab) => (
                <article key={lab.id} className={styles.labItem}>
                  <div className={styles.labHead}>
                    <div>
                      <strong>{lab.date}</strong>
                      <span>Registro diario</span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => handleEdit(lab)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.dangerButton}
                        type="button"
                        onClick={() => handleDelete(lab.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  <div className={styles.valuesGrid}>
                    {fixedFields.map((field) => (
                      <div key={`${lab.id}-${field.key}`} className={styles.valueCell}>
                        <span>{field.label}</span>
                        <strong>{lab[field.key] || "-"}</strong>
                      </div>
                    ))}
                    <div className={`${styles.valueCell} ${styles.extraCell}`}>
                      <span>Exame extra</span>
                      <strong>
                        {lab.extraExamName
                          ? `${lab.extraExamName}: ${lab.extraExamValue || "-"}`
                          : "Sem exame extra"}
                      </strong>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className={styles.empty}>Nenhum registro laboratorial diario para este paciente.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
