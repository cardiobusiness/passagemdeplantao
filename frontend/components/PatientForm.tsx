"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createPatient } from "@/lib/api";
import styles from "./PatientForm.module.css";

type Props = {
  availableBeds: Array<{ id: number; code: string }>;
  preferredBedId?: number | null;
};

const initialForm = {
  name: "",
  recordNumber: "",
  age: "",
  diagnosis: "",
  bedId: "",
  admissionDate: "",
  ventilatorySupport: "Cateter nasal",
  mobilityLevel: "Restrito ao leito"
};

export function PatientForm({ availableBeds, preferredBedId = null }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    bedId:
      preferredBedId && availableBeds.some((bed) => bed.id === preferredBedId)
        ? String(preferredBedId)
        : ""
  }));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const requiredEntries = [
      ["name", form.name],
      ["recordNumber", form.recordNumber],
      ["age", form.age],
      ["diagnosis", form.diagnosis],
      ["bedId", form.bedId],
      ["admissionDate", form.admissionDate],
      ["ventilatorySupport", form.ventilatorySupport],
      ["mobilityLevel", form.mobilityLevel]
    ];

    const missingFields = requiredEntries
      .filter(([, value]) => !String(value).trim())
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return `Preencha os campos obrigatorios: ${missingFields.join(", ")}.`;
    }

    if (!Number.isInteger(Number(form.age)) || Number(form.age) <= 0) {
      return "Informe uma idade valida.";
    }

    if (!availableBeds.some((bed) => bed.id === Number(form.bedId))) {
      return "Selecione um leito disponivel.";
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

    setLoading(true);

    try {
      await createPatient({
        name: form.name.trim(),
        recordNumber: form.recordNumber.trim(),
        age: Number(form.age),
        diagnosis: form.diagnosis.trim(),
        bedId: Number(form.bedId),
        admissionDate: form.admissionDate,
        ventilatorySupport: form.ventilatorySupport,
        mobilityLevel: form.mobilityLevel
      });

      setMessage("Paciente cadastrado com sucesso.");
      setForm({
        ...initialForm,
        bedId:
          preferredBedId && availableBeds.some((bed) => bed.id === preferredBedId)
            ? String(preferredBedId)
            : ""
      });
      router.refresh();
    } catch (submissionError) {
      const errorMessage =
        submissionError instanceof Error
          ? submissionError.message
          : "Nao foi possivel salvar o paciente.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className={`${styles.card} card`}>
      <h2>Novo paciente</h2>
      <p className={styles.intro}>
        Cadastro inicial com dados basicos de admissao, leito, suporte ventilatorio e perfil motor.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="name">Nome completo</label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="recordNumber">Prontuario</label>
          <input
            id="recordNumber"
            value={form.recordNumber}
            onChange={(event) => updateField("recordNumber", event.target.value)}
            placeholder="CTI-1041"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="age">Idade</label>
          <input
            id="age"
            type="number"
            min="0"
            value={form.age}
            onChange={(event) => updateField("age", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="bedId">Leito</label>
          <select
            id="bedId"
            value={form.bedId}
            onChange={(event) => updateField("bedId", event.target.value)}
            required
          >
            <option value="">Selecione um leito vago</option>
            {availableBeds.map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.code}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="diagnosis">Diagnostico principal</label>
          <textarea
            id="diagnosis"
            rows={3}
            value={form.diagnosis}
            onChange={(event) => updateField("diagnosis", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="admissionDate">Data de admissao</label>
          <input
            id="admissionDate"
            type="date"
            value={form.admissionDate}
            onChange={(event) => updateField("admissionDate", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ventilatorySupport">Suporte ventilatorio</label>
          <select
            id="ventilatorySupport"
            value={form.ventilatorySupport}
            onChange={(event) => updateField("ventilatorySupport", event.target.value)}
          >
            <option>Ar ambiente</option>
            <option>Cateter nasal</option>
            <option>Mascara de Venturi</option>
            <option>VNI</option>
            <option>VMI</option>
            <option>Traqueostomia</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="mobilityLevel">Perfil motor</label>
          <select
            id="mobilityLevel"
            value={form.mobilityLevel}
            onChange={(event) => updateField("mobilityLevel", event.target.value)}
          >
            <option>Restrito ao leito</option>
            <option>Mobilizacao passiva</option>
            <option>Sedestacao assistida</option>
            <option>Sedestacao</option>
            <option>Marcha assistida</option>
            <option>Deambulacao parcial</option>
          </select>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button
            className={styles.submit}
            type="submit"
            disabled={loading || availableBeds.length === 0}
          >
            {loading ? "Salvando..." : "Cadastrar paciente"}
          </button>
        </div>
        {availableBeds.length === 0 ? (
          <p className={styles.error}>Nao ha leitos vagos disponiveis para cadastro.</p>
        ) : null}
      </form>
    </section>
  );
}
