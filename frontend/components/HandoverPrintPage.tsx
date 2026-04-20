"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/lib/auth";
import { getActiveProfessionals } from "@/lib/api";
import { Bed, Patient, User } from "@/lib/types";
import styles from "./handover-print-page.module.css";

type HandoverPrintPageProps = {
  beds: Bed[];
  patients: Patient[];
};

type ParsedSelection = {
  bedNumbers: number[];
  invalidEntries: string[];
};

const noteLines = Array.from({ length: 5 }, (_, index) => index);

function getBedNumber(bed: Bed) {
  const match = bed.code.match(/\d+/);
  return match ? Number(match[0]) : bed.id;
}

function parseSelectionInput(input: string): ParsedSelection {
  const numbers = new Set<number>();
  const invalidEntries = new Set<string>();

  input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      if (entry.includes("-")) {
        const [startRaw, endRaw] = entry.split("-").map((part) => part.trim());
        const start = Number(startRaw);
        const end = Number(endRaw);

        if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
          invalidEntries.add(entry);
          return;
        }

        for (let current = start; current <= end; current += 1) {
          numbers.add(current);
        }

        return;
      }

      const number = Number(entry);

      if (!Number.isInteger(number)) {
        invalidEntries.add(entry);
        return;
      }

      numbers.add(number);
    });

  return {
    bedNumbers: [...numbers].sort((left, right) => left - right),
    invalidEntries: [...invalidEntries]
  };
}

function formatMetric(value: number | null, unit: string) {
  if (value === null) {
    return "Nao informado";
  }

  return `${value} ${unit}`;
}

function formatPrintDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
}

function getClinicalSummary(patient: Patient) {
  const parts = [
    patient.reasonForAdmission,
    patient.clinicalHistory.comorbidities[0],
    patient.clinicalHistory.intercurrences[0]
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Nao informado";
}

function getTherapeuticConduct(patient: Patient) {
  const parts = [
    patient.physiotherapyPlan.conducts.join(", "),
    patient.physiotherapyPlan.patientResponse
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Nao informado";
}

function getLatestLabSummary(patient: Patient) {
  const latestLab = [...patient.labs].sort((left, right) => right.date.localeCompare(left.date))[0];

  if (!latestLab) {
    return "Nao informado";
  }

  return `HB ${latestLab.hb || "-"} | Leuco ${latestLab.leuco || "-"} | PCR ${latestLab.pcr || "-"} | Cr ${
    latestLab.cr || "-"
  } | Lactato ${latestLab.ac || "-"}`;
}

function getLatestChestXray(patient: Patient) {
  const latestChestXray = [...patient.imaging]
    .filter((exam) => exam.type.toLowerCase().includes("rx"))
    .sort((left, right) => right.date.localeCompare(left.date))[0];

  return latestChestXray?.result || "Nao informado";
}

export function HandoverPrintPage({ beds, patients }: HandoverPrintPageProps) {
  const occupiedBeds = useMemo(
    () =>
      [...beds]
        .filter((bed) => bed.occupied)
        .sort((left, right) => getBedNumber(left) - getBedNumber(right)),
    [beds]
  );

  const patientById = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);

  const [professionals, setProfessionals] = useState<User[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [selectedBedIds, setSelectedBedIds] = useState<number[]>([]);
  const [selectionInput, setSelectionInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [singleSheetMode, setSingleSheetMode] = useState(true);
  const [error, setError] = useState("");
  const [selectionMessage, setSelectionMessage] = useState("");

  useEffect(() => {
    async function loadProfessionals() {
      const token = getStoredToken();

      if (!token) {
        setError("Sessao nao encontrada.");
        return;
      }

      try {
        const nextProfessionals = await getActiveProfessionals(token);
        setProfessionals(nextProfessionals);

        if (nextProfessionals.length > 0) {
          setSelectedProfessionalId((current) => current ?? nextProfessionals[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os profissionais.");
      }
    }

    loadProfessionals();
  }, []);

  const selectedProfessional =
    professionals.find((professional) => professional.id === selectedProfessionalId) ?? null;

  const selectedBeds = useMemo(
    () =>
      occupiedBeds.filter((bed) => selectedBedIds.includes(bed.id) && patientById.has(bed.patientId ?? -1)),
    [occupiedBeds, patientById, selectedBedIds]
  );

  function setOrderedBedSelection(nextBedIds: number[]) {
    const ordered = [...nextBedIds].sort((left, right) => {
      const leftBed = occupiedBeds.find((bed) => bed.id === left);
      const rightBed = occupiedBeds.find((bed) => bed.id === right);
      return (leftBed ? getBedNumber(leftBed) : left) - (rightBed ? getBedNumber(rightBed) : right);
    });

    setSelectedBedIds(ordered);
  }

  function toggleBedSelection(bedId: number) {
    setSelectionMessage("");

    setOrderedBedSelection(
      selectedBedIds.includes(bedId)
        ? selectedBedIds.filter((currentBedId) => currentBedId !== bedId)
        : [...selectedBedIds, bedId]
    );
  }

  function selectAllBeds() {
    setSelectionMessage("");
    setOrderedBedSelection(occupiedBeds.map((bed) => bed.id));
  }

  function clearSelection() {
    setSelectionMessage("");
    setSelectionInput("");
    setSelectedBedIds([]);
    setPreviewMode(false);
  }

  function applySelectionInput() {
    const trimmedInput = selectionInput.trim();

    if (!trimmedInput) {
      setSelectionMessage("Informe leitos como 110-124, 101,102,105 ou misto.");
      setSelectedBedIds([]);
      setPreviewMode(false);
      return;
    }

    const parsedSelection = parseSelectionInput(trimmedInput);

    if (parsedSelection.invalidEntries.length > 0) {
      setSelectionMessage(`Entradas invalidas ignoradas: ${parsedSelection.invalidEntries.join(", ")}`);
    } else {
      setSelectionMessage("");
    }

    const availableBedIds = parsedSelection.bedNumbers
      .map((bedNumber) => occupiedBeds.find((bed) => getBedNumber(bed) === bedNumber)?.id ?? null)
      .filter((bedId): bedId is number => typeof bedId === "number");

    const ignoredVagueOrMissingBeds = parsedSelection.bedNumbers.filter(
      (bedNumber) => !occupiedBeds.some((bed) => getBedNumber(bed) === bedNumber)
    );

    setOrderedBedSelection(availableBedIds);
    setPreviewMode(true);

    if (ignoredVagueOrMissingBeds.length > 0) {
      setSelectionMessage((current) => {
        const ignoredMessage = `Leitos vagos ou inexistentes ignorados: ${ignoredVagueOrMissingBeds.join(", ")}`;
        return current ? `${current} | ${ignoredMessage}` : ignoredMessage;
      });
    }
  }

  function handlePrint() {
    setPreviewMode(true);
    window.setTimeout(() => window.print(), 120);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="pill">Passagem de Plantao</span>
          <h1>Impressao personalizada</h1>
          <p>
            Selecione o profissional e os leitos desejados para gerar o resumo impresso
            com os dados reais dos pacientes e espaco para anotacoes manuais.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={`${styles.controlsPanel} card`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Configuracao</h2>
              <p>Defina o profissional responsavel e os leitos incluidos na passagem de plantao.</p>
            </div>
          </div>

          <label className={styles.field}>
            <span>Profissional</span>
            <select
              value={selectedProfessionalId ?? ""}
              onChange={(event) => setSelectedProfessionalId(Number(event.target.value) || null)}
            >
              <option value="">Selecione um profissional</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name} - {professional.jobTitle}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Leitos por sequencia ou individual</span>
            <input
              type="text"
              value={selectionInput}
              onChange={(event) => setSelectionInput(event.target.value)}
              placeholder="101-105,108,110"
            />
          </label>

          <div className={styles.selectionActions}>
            <button type="button" className={styles.secondaryButton} onClick={applySelectionInput}>
              Aplicar selecao
            </button>
            <button type="button" className={styles.secondaryButton} onClick={selectAllBeds}>
              Selecionar todos os leitos
            </button>
            <button type="button" className={styles.secondaryButton} onClick={clearSelection}>
              Limpar selecao
            </button>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={singleSheetMode}
              onChange={(event) => setSingleSheetMode(event.target.checked)}
            />
            <span>Gerar folha por profissional</span>
          </label>

          <div className={styles.bedList}>
            {occupiedBeds.map((bed) => {
              const patient = bed.patientId ? patientById.get(bed.patientId) : null;

              return (
                <label key={bed.id} className={styles.bedItem}>
                  <input
                    type="checkbox"
                    checked={selectedBedIds.includes(bed.id)}
                    onChange={() => toggleBedSelection(bed.id)}
                  />
                  <div>
                    <strong>{bed.code}</strong>
                    <span>{patient?.name || "Nao informado"}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {selectionMessage ? <p className={styles.info}>{selectionMessage}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.footerActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setPreviewMode((current) => !current)}>
              {previewMode ? "Ocultar visualizacao" : "Visualizar impressao"}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handlePrint}
              disabled={!selectedProfessional || selectedBeds.length === 0}
            >
              Imprimir
            </button>
          </div>
        </section>

        <section className={`${styles.previewPanel} ${previewMode ? styles.previewVisible : ""}`}>
          <div className={styles.previewHeader}>
            <div>
              <h2>Pre-visualizacao</h2>
              <p>{selectedBeds.length} leitos validos selecionados para impressao.</p>
            </div>
          </div>

          {!selectedProfessional ? (
            <div className={`${styles.emptyState} card`}>Selecione um profissional para montar a passagem de plantao.</div>
          ) : selectedBedIds.length === 0 ? (
            <div className={`${styles.emptyState} card`}>Nenhum leito selecionado.</div>
          ) : selectedBeds.length === 0 ? (
            <div className={`${styles.emptyState} card`}>Nenhum paciente encontrado.</div>
          ) : (
            <div className={`${styles.printArea} ${singleSheetMode ? styles.singleSheetMode : ""}`}>
              <table className={styles.printTable}>
                <thead>
                  <tr>
                    <th>
                      <div className={styles.printBanner}>
                        <div>
                          <span className={styles.printEyebrow}>Passagem de Plantao</span>
                          <h3>Gestao Inteligente de CTI</h3>
                          <p>
                            Profissional: {selectedProfessional.name} • {selectedProfessional.jobTitle}
                          </p>
                        </div>
                        <div className={styles.printMeta}>
                          <strong>Impressao</strong>
                          <span>{formatPrintDate()}</span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBeds.map((bed) => {
                    const patient = bed.patientId ? patientById.get(bed.patientId) : null;

                    if (!patient) {
                      return null;
                    }

                    return (
                      <tr key={bed.id} className={styles.printRow}>
                        <td>
                          <article className={styles.printCard}>
                            <header className={styles.patientHeader}>
                              <div>
                                <span className={styles.bedBadge}>{bed.code}</span>
                                <h4>{patient.name || "Nao informado"}</h4>
                              </div>
                              <div className={styles.patientMeta}>
                                <span>Registro: {patient.recordNumber || "Nao informado"}</span>
                                <span>Idade: {patient.age ? `${patient.age} anos` : "Nao informado"}</span>
                                <span>Tempo CTI: {formatMetric(patient.stayMetrics.ctiDays, "dias")}</span>
                                <span>Tempo VM: {formatMetric(patient.stayMetrics.mechanicalVentilationDays, "dias")}</span>
                              </div>
                            </header>

                            <div className={styles.summaryGrid}>
                              <section className={styles.summaryBlock}>
                                <span>Resumo do historico clinico</span>
                                <p>{getClinicalSummary(patient)}</p>
                              </section>

                              <section className={styles.summaryBlock}>
                                <span>Conduta terapeutica</span>
                                <p>{getTherapeuticConduct(patient)}</p>
                              </section>

                              <section className={styles.summaryBlock}>
                                <span>Laboratorio</span>
                                <p>{getLatestLabSummary(patient)}</p>
                              </section>

                              <section className={styles.summaryBlock}>
                                <span>Relato da radiografia</span>
                                <p>{getLatestChestXray(patient)}</p>
                              </section>
                            </div>

                            <section className={styles.notesBlock}>
                              <span>Observações</span>
                              <div className={styles.noteLines}>
                                {noteLines.map((line) => (
                                  <div key={`${bed.id}-note-line-${line}`} className={styles.noteLine} />
                                ))}
                              </div>
                            </section>
                          </article>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
