"use client";

import { FormEvent, useEffect, useState } from "react";
import { getOrganizationMe, updateOrganizationMe } from "@/lib/api";
import { getStoredToken, getStoredUser, saveSession } from "@/lib/auth";
import { Organization, UpdateOrganizationPayload } from "@/lib/types";
import { AdminNav } from "./AdminNav";
import styles from "./admin-saas-page.module.css";

const initialForm: UpdateOrganizationPayload = {
  name: "",
  document: "",
  email: "",
  phone: ""
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function getTrialLabel(organization: Organization | null) {
  if (!organization) {
    return "Nao informado";
  }

  if (organization.status === "trial") {
    return `${organization.trialDaysRemaining} ${organization.trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}`;
  }

  return organization.status === "active" ? "Ativo" : organization.status;
}

export function OrganizationAdminPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function loadOrganization() {
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextOrganization = await getOrganizationMe(token);
      setOrganization(nextOrganization);
      setForm({
        name: nextOrganization.name ?? "",
        document: nextOrganization.document ?? "",
        email: nextOrganization.email ?? "",
        phone: nextOrganization.phone ?? ""
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar a organizacao.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganization();
  }, []);

  function updateField(field: keyof UpdateOrganizationPayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredToken();

    if (!token) {
      setError("Sessao nao encontrada.");
      return;
    }

    setSaving(true);
    setFeedback("");
    setError("");

    try {
      const updatedOrganization = await updateOrganizationMe(token, {
        name: form.name.trim(),
        document: form.document?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null
      });

      setOrganization(updatedOrganization);
      const user = getStoredUser();

      if (user) {
        saveSession({ ...user, organization: updatedOrganization }, token);
      }

      setFeedback("Organizacao atualizada com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar a organizacao.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="pill">Administracao SaaS</span>
          <h1>Organizacao</h1>
          <p>Dados da conta hospitalar usada para isolar usuarios, setores, leitos e dados clinicos.</p>
        </div>
      </header>

      <AdminNav />

      <div className={styles.grid}>
        <section className={`${styles.panel} card`}>
          <div className={styles.sectionHeader}>
            <h2>Dados da organizacao atual</h2>
            <p>As informacoes editaveis ficam vinculadas somente a organizacao logada.</p>
          </div>

          {loading ? <p className={styles.empty}>Carregando organizacao...</p> : null}

          {organization ? (
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span>Plano</span>
                <strong>{organization.plan}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Status</span>
                <strong>{organization.status}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Trial</span>
                <strong>{getTrialLabel(organization)}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Fim do trial</span>
                <strong>{formatDate(organization.trialEndsAt)}</strong>
              </div>
            </div>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>

        <section className={`${styles.panel} card`}>
          <div className={styles.sectionHeader}>
            <h2>Editar identificacao</h2>
            <p>Nome, documento e contatos aparecem na conta da propria organizacao.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Nome do hospital/clinica</span>
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>

            <label className={styles.field}>
              <span>CNPJ/documento</span>
              <input value={form.document ?? ""} onChange={(event) => updateField("document", event.target.value)} />
            </label>

            <label className={styles.field}>
              <span>E-mail</span>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Telefone</span>
              <input value={form.phone ?? ""} onChange={(event) => updateField("phone", event.target.value)} />
            </label>

            {feedback ? <p className={styles.success}>{feedback}</p> : null}

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={saving || loading}>
                {saving ? "Salvando..." : "Salvar organizacao"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}
