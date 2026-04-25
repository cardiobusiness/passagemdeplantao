"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSector, getSectors, updateSector } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { Sector, SectorFormPayload } from "@/lib/types";
import { AdminNav } from "./AdminNav";
import styles from "./admin-saas-page.module.css";

const initialForm: SectorFormPayload = {
  name: "",
  isActive: true
};

export function SectorsAdminPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [form, setForm] = useState<SectorFormPayload>(initialForm);
  const [editingSectorId, setEditingSectorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function loadSectors() {
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextSectors = await getSectors(token);
      setSectors(nextSectors);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os setores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSectors();
  }, []);

  function resetForm() {
    setEditingSectorId(null);
    setForm(initialForm);
  }

  function startEdit(sector: Sector) {
    setEditingSectorId(sector.id);
    setForm({
      name: sector.name,
      isActive: sector.isActive
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

    setSubmitting(true);
    setFeedback("");
    setError("");

    try {
      if (editingSectorId) {
        await updateSector(token, editingSectorId, form);
        setFeedback("Setor atualizado com sucesso.");
      } else {
        await createSector(token, form);
        setFeedback("Setor cadastrado com sucesso.");
      }

      resetForm();
      await loadSectors();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar o setor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(sector: Sector) {
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      return;
    }

    setFeedback("");
    setError("");

    try {
      await updateSector(token, sector.id, { isActive: !sector.isActive });
      setFeedback(`Setor ${!sector.isActive ? "ativado" : "desativado"} com sucesso.`);
      await loadSectors();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Nao foi possivel atualizar o setor.");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="pill">Administracao SaaS</span>
          <h1>Setores</h1>
          <p>Cadastre e mantenha as unidades assistenciais da organizacao logada.</p>
        </div>
      </header>

      <AdminNav />

      <div className={styles.grid}>
        <section className={`${styles.panel} card`}>
          <div className={styles.sectionHeader}>
            <h2>{editingSectorId ? "Editar setor" : "Novo setor"}</h2>
            <p>Exemplos: CTI 1, CTI 2, Unidade Coronariana, Enfermaria.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Nome do setor</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Setor ativo</span>
            </label>

            {feedback ? <p className={styles.success}>{feedback}</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : editingSectorId ? "Salvar alteracoes" : "Cadastrar setor"}
              </button>
              {editingSectorId ? (
                <button className={styles.secondaryButton} type="button" onClick={resetForm}>
                  Cancelar edicao
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className={`${styles.panel} card`}>
          <div className={styles.sectionHeader}>
            <h2>Setores cadastrados</h2>
            <p>{sectors.length} setores encontrados nesta organizacao.</p>
          </div>

          {loading ? <p className={styles.empty}>Carregando setores...</p> : null}

          <div className={styles.list}>
            {sectors.map((sector) => (
              <article key={sector.id} className={styles.itemCard}>
                <div className={styles.itemHeading}>
                  <div>
                    <strong>{sector.name}</strong>
                    <span>{sector.bedCount} leitos vinculados</span>
                  </div>
                  <span className={sector.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {sector.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className={styles.cardActions}>
                  <button className={styles.secondaryButton} type="button" onClick={() => startEdit(sector)}>
                    Editar
                  </button>
                  <button className={styles.secondaryButton} type="button" onClick={() => handleToggleStatus(sector)}>
                    {sector.isActive ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </article>
            ))}

            {!loading && sectors.length === 0 ? (
              <p className={styles.empty}>Nenhum setor cadastrado.</p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
