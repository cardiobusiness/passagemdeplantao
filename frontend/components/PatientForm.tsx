"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createPatient } from "@/lib/api";
import { createEmptyVentilatorySupport, normalizeVentilatorySupportType, VENTILATORY_SUPPORT_OPTIONS } from "@/lib/ventilatorySupport";
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
  origin: "",
  internalTransferLocation: "",
  bedId: "",
  admissionDate: "",
  ventilatorySupport: createEmptyVentilatorySupport("cateter_nasal"),
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

  function validateVentilatorySupport() {
    const support = form.ventilatorySupport;

    if (!support.type) {
      return "Selecione o tipo de suporte ventilatorio.";
    }

    if (support.type === "cateter_nasal" && !support.flowRate) {
      return "Informe a litragem do cateter nasal.";
    }

    if (support.type === "venturi" && (!support.flowRate || !support.fio2)) {
      return "Informe fluxo e FiO2 para mascara de Venturi.";
    }

    if (support.type === "alto_fluxo" && (!support.flowRate || !support.fio2)) {
      return "Informe fluxo e FiO2 para alto fluxo.";
    }

    if (support.type === "macronebulizacao" && !support.flowRate) {
      return "Informe o fluxo para macronebulizacao.";
    }

    if (support.type === "vni" && (!support.mode || !support.ipap || !support.epap || !support.fio2)) {
      return "Informe modo, IPAP, EPAP e FiO2 para VNI.";
    }

    if (
      support.type === "vmi" &&
      (!support.mode ||
        !support.tidalVolume ||
        !support.respiratoryRate ||
        !support.peep ||
        !support.fio2 ||
        !support.pressureSupport)
    ) {
      return "Informe os parametros obrigatorios da ventilacao mecanica invasiva.";
    }

    return null;
  }

  function validateForm() {
    const requiredEntries = [
      ["name", form.name],
      ["recordNumber", form.recordNumber],
      ["age", form.age],
      ["diagnosis", form.diagnosis],
      ["origin", form.origin],
      ["bedId", form.bedId],
      ["admissionDate", form.admissionDate],
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

    if (form.origin === "transferencia_interna" && !form.internalTransferLocation.trim()) {
      return "Informe o local da transferencia interna.";
    }

    return validateVentilatorySupport();
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
      console.log("cadastro paciente");
      await createPatient({
        name: form.name.trim(),
        recordNumber: form.recordNumber.trim(),
        age: Number(form.age),
        diagnosis: form.diagnosis.trim(),
        origin: form.origin,
        internalTransferLocation:
          form.origin === "transferencia_interna" ? form.internalTransferLocation.trim() : null,
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
      router.replace("/dashboard");
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

  function updateField(field: "name" | "recordNumber" | "age" | "diagnosis" | "origin" | "internalTransferLocation" | "bedId" | "admissionDate" | "mobilityLevel", value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "origin" && value !== "transferencia_interna" ? { internalTransferLocation: "" } : {})
    }));
  }

  function updateSupportField(field: keyof typeof form.ventilatorySupport, value: string) {
    setForm((current) => {
      if (field === "type") {
        const supportType = normalizeVentilatorySupportType(value);
        return {
          ...current,
          ventilatorySupport: {
            ...createEmptyVentilatorySupport(supportType),
            type: supportType,
            label: VENTILATORY_SUPPORT_OPTIONS.find((option) => option.value === supportType)?.label ?? "Nao informado"
          }
        };
      }

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

      return {
        ...current,
        ventilatorySupport: {
          ...current.ventilatorySupport,
          [field]: numericFields.includes(field as string) ? (value ? Number(value) : null) : value
        }
      };
    });
  }

  const support = form.ventilatorySupport;

  return (
    <section className={`${styles.card} card`}>
      <h2>Novo paciente</h2>
      <p className={styles.intro}>
        Cadastro inicial com dados basicos de admissao, leito, suporte ventilatorio e perfil motor.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="name">Nome completo</label>
          <input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
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
          <input id="age" type="number" min="0" value={form.age} onChange={(event) => updateField("age", event.target.value)} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="bedId">Leito</label>
          <select id="bedId" value={form.bedId} onChange={(event) => updateField("bedId", event.target.value)} required>
            <option value="">Selecione um leito vago</option>
            {availableBeds.map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.code}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="origin">Origem do paciente</label>
          <select id="origin" value={form.origin} onChange={(event) => updateField("origin", event.target.value)} required>
            <option value="">Selecione a origem</option>
            <option value="emergencia">Emergencia</option>
            <option value="transferencia_externa">Transferencia externa</option>
            <option value="centro_cirurgico">Centro Cirurgico</option>
            <option value="transferencia_interna">Transferencia interna</option>
          </select>
        </div>

        {form.origin === "transferencia_interna" ? (
          <div className={styles.field}>
            <label htmlFor="internalTransferLocation">Local da transferencia interna</label>
            <input
              id="internalTransferLocation"
              value={form.internalTransferLocation}
              onChange={(event) => updateField("internalTransferLocation", event.target.value)}
              placeholder="Ex.: Enfermaria"
              required
            />
          </div>
        ) : null}

        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="diagnosis">Diagnostico principal</label>
          <textarea id="diagnosis" rows={3} value={form.diagnosis} onChange={(event) => updateField("diagnosis", event.target.value)} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="admissionDate">Data de admissao</label>
          <input id="admissionDate" type="date" value={form.admissionDate} onChange={(event) => updateField("admissionDate", event.target.value)} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="ventilatorySupportType">Tipo de suporte ventilatorio</label>
          <select
            id="ventilatorySupportType"
            value={support.type}
            onChange={(event) => updateSupportField("type", event.target.value)}
          >
            {VENTILATORY_SUPPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {support.type === "cateter_nasal" ? (
          <div className={styles.field}>
            <label htmlFor="flowRate">Litragem (L/min)</label>
            <input id="flowRate" type="number" min="0" value={support.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
          </div>
        ) : null}

        {support.type === "venturi" ? (
          <>
            <div className={styles.field}>
              <label htmlFor="venturiFlow">Fluxo (L/min)</label>
              <input id="venturiFlow" type="number" min="0" value={support.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="venturiFio2">FiO2 (%)</label>
              <input id="venturiFio2" type="number" min="0" value={support.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
            </div>
          </>
        ) : null}

        {support.type === "alto_fluxo" ? (
          <>
            <div className={styles.field}>
              <label htmlFor="hfncFlow">Fluxo (L/min)</label>
              <input id="hfncFlow" type="number" min="0" value={support.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="hfncFio2">FiO2 (%)</label>
              <input id="hfncFio2" type="number" min="0" value={support.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="temperature">Temperatura</label>
              <input id="temperature" type="number" min="0" value={support.temperature ?? ""} onChange={(event) => updateSupportField("temperature", event.target.value)} />
            </div>
          </>
        ) : null}

        {support.type === "macronebulizacao" ? (
          <>
            <div className={styles.field}>
              <label htmlFor="macroFlow">Fluxo (L/min)</label>
              <input id="macroFlow" type="number" min="0" value={support.flowRate ?? ""} onChange={(event) => updateSupportField("flowRate", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="solution">Solucao</label>
              <input id="solution" value={support.solution ?? ""} onChange={(event) => updateSupportField("solution", event.target.value)} placeholder="SF, broncodilatador..." />
            </div>
          </>
        ) : null}

        {support.type === "vni" ? (
          <>
            <div className={styles.field}>
              <label htmlFor="vniMode">Modo</label>
              <select id="vniMode" value={support.mode ?? ""} onChange={(event) => updateSupportField("mode", event.target.value)}>
                <option value="">Selecione</option>
                <option value="CPAP">CPAP</option>
                <option value="BIPAP">BIPAP</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="ipap">IPAP</label>
              <input id="ipap" type="number" min="0" value={support.ipap ?? ""} onChange={(event) => updateSupportField("ipap", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="epap">EPAP</label>
              <input id="epap" type="number" min="0" value={support.epap ?? ""} onChange={(event) => updateSupportField("epap", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="vniFio2">FiO2 (%)</label>
              <input id="vniFio2" type="number" min="0" value={support.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
            </div>
          </>
        ) : null}

        {support.type === "vmi" ? (
          <>
            <div className={styles.field}>
              <label htmlFor="vmiMode">Modo ventilatorio</label>
              <input id="vmiMode" value={support.mode ?? ""} onChange={(event) => updateSupportField("mode", event.target.value)} placeholder="VCV, PCV, PSV..." />
            </div>
            <div className={styles.field}>
              <label htmlFor="tidalVolume">Volume corrente</label>
              <input id="tidalVolume" type="number" min="0" value={support.tidalVolume ?? ""} onChange={(event) => updateSupportField("tidalVolume", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="respiratoryRate">Frequencia respiratoria</label>
              <input id="respiratoryRate" type="number" min="0" value={support.respiratoryRate ?? ""} onChange={(event) => updateSupportField("respiratoryRate", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="peep">PEEP</label>
              <input id="peep" type="number" min="0" value={support.peep ?? ""} onChange={(event) => updateSupportField("peep", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="fio2">FiO2 (%)</label>
              <input id="fio2" type="number" min="0" value={support.fio2 ?? ""} onChange={(event) => updateSupportField("fio2", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="pressureSupport">Pressao suporte</label>
              <input id="pressureSupport" type="number" min="0" value={support.pressureSupport ?? ""} onChange={(event) => updateSupportField("pressureSupport", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="targetSaturation">Saturacao alvo</label>
              <input id="targetSaturation" type="number" min="0" value={support.targetSaturation ?? ""} onChange={(event) => updateSupportField("targetSaturation", event.target.value)} />
            </div>
          </>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="mobilityLevel">Perfil motor</label>
          <select id="mobilityLevel" value={form.mobilityLevel} onChange={(event) => updateField("mobilityLevel", event.target.value)}>
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
          <button className={styles.submit} type="submit" disabled={loading || availableBeds.length === 0}>
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
