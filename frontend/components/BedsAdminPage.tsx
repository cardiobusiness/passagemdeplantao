"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAdminBed,
  getAdminBeds,
  getSectors,
  updateAdminBed
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { Bed, BedFormPayload, Sector } from "@/lib/types";
import { AdminNav } from "./AdminNav";
import styles from "./admin-saas-page.module.css";

const initialForm: BedFormPayload = {
  code: "",
  sectorId: 0,
  isActive: true
};

export function BedsAdminPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [form, setForm] = useState<BedFormPayload>(initialForm);
  const [editingBedId, setEditingBedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const sectorById = useMemo(() => {
    return new Map(sectors.map((sector) => [sector.id, sector]));
  }, [sectors]);

  const sectorOptions = useMemo(() => {
    const activeSectors = sectors.filter((sector) => sector.isActive);
    const currentSector =
      form.sectorId && !activeSectors.some((sector) => sector.id === form.sectorId)
        ? sectors.find((sector) => sector.id === form.sectorId)
        : null;

    return currentSector ? [...activeSectors, currentSector] : activeSectors;
  }, [form.sectorId, sectors]);

  async function loadData() {
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextSectors, nextBeds] = await Promise.all([
        getSectors(token),
        getAdminBeds(token)
      ]);

      setSectors(nextSectors);
      setBeds(nextBeds);

      const firstActiveSector = nextSectors.find((sector) => sector.isActive);
      setForm((current) => ({
        ...current,
        sectorId: current.sectorId || firstActiveSector?.id || 0
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os leitos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    const firstActiveSector = sectors.find((sector) => sector.isActive);
    setEditingBedId(null);
    setForm({
      ...initialForm,
      sectorId: firstActiveSector?.id || 0
    });
  }

  function startEdit(bed: Bed) {
    setEditingBedId(bed.id);
    setForm({
      code: bed.code,
      sectorId: bed.sectorId ?? 0,
      isActive: bed.isActive
    });
    setFeedback("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      return;
    }

    if (!form.sectorId) {
      setError("Selecione um setor ativo.");
      return;
    }

    setSubmitting(true);
    setFeedback("");
    setError("");

    try {
      if (editingBedId) {
        await updateAdminBed(token, editingBedId, form);
        setFeedback("Leito atualizado com sucesso.");
      } else {
        await createAdminBed(token, form);
        setFeedback("Leito cadastrado com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar o leito.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(bed: Bed) {
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      return;
    }

    setFeedback("");
    setError("");

    try {
      await updateAdminBed(token, bed.id, { isActive: !bed.isActive });
      setFeedback(`Leito ${!bed.isActive ? "ativado" : "desativado"} com sucesso.`);
      await loadData();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Nao foi possivel atualizar o leito.");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="pill">Administracao SaaS</span>
          <h1>Leitos</h1>
          <p>Cadastre e mantenha os leitos da organizacao logada, sempre vinculados a um setor.</p>
        </div>
      </header>

      <AdminNav />

      <div className={styles.grid}>
        <section className={`${styles.panel} card`}>
          <div className={styles.sectionHeader}>
            <h2>{editingBedId ? "Editar leito" : "Novo leito"}</h2>
            <p>Leitos criados entram com status inicial Vago e sem paciente vinculado.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Setor</span>
              <select
                value={form.sectorId || ""}
                onChange={(event) => setForm((current) => ({ ...current, sectorId: Number(event.target.value) }))}
                required
              >
                <option value="">Selecione um setor</option>
                {sectorOptions.map((sector) => (
                  <option key={sector.id} value={sector.id} disabled={!sector.isActive}>
                    {sector.name}{sector.isActive ? "" : " (inativo)"}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Codigo do leito</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                placeholder="L101"
                required
              />
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Leito ativo</span>
            </label>

            {feedback ? <p className={styles.success}>{feedback}</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={submitting || sectorOptions.length === 0}>
                {submitting ? "Salvando..." : editingBedId ? "Salvar alteracoes" : "Cadastrar leito"}
              </button>
              {editingBedId ? (
                <button className={styles.secondaryButton} type="button" onClick={resetForm}>
                  Cancelar edicao
                </button>
              ) : null}
            </div>

            {sectorOptions.length === 0 ? (
              <p className={styles.error}>Cadastre ou ative um setor antes de criar leitos.</p>
            ) : null}
          </form>
        </section>

        <section className={`${styles.panel} card`}>
          <div className={styles.sectionHeader}>
            <h2>Leitos cadastrados</h2>
            <p>{beds.length} leitos encontrados nesta organizacao.</p>
          </div>

          {loading ? <p className={styles.empty}>Carregando leitos...</p> : null}

          <div className={styles.list}>
            {beds.map((bed) => {
              const sector = bed.sectorId ? sectorById.get(bed.sectorId) : null;

              return (
                <article key={bed.id} className={styles.itemCard}>
                  <div className={styles.itemHeading}>
                    <div>
                      <strong>{bed.code}</strong>
                      <span>{sector?.name ?? bed.sector}</span>
                    </div>
                    <span className={bed.isActive ? styles.activeBadge : styles.inactiveBadge}>
                      {bed.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className={styles.itemMeta}>
                    <span>Status: {bed.status}</span>
                    <span>{bed.occupied ? "Ocupado" : "Vago"}</span>
                    {sector && !sector.isActive ? <span>Setor inativo</span> : null}
                  </div>

                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => startEdit(bed)}>
                      Editar
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => handleToggleStatus(bed)}>
                      {bed.isActive ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </article>
              );
            })}

            {!loading && beds.length === 0 ? (
              <p className={styles.empty}>Nenhum leito cadastrado.</p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
