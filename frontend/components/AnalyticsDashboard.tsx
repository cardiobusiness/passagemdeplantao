"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";

import { Bed, DashboardSummary, Patient } from "@/lib/types";
import { formatVentilatorySupport, getVentilatorySupportLabel, isMechanicalVentilationType, normalizeVentilatorySupportType } from "@/lib/ventilatorySupport";

import styles from "./AnalyticsDashboard.module.css";

type AnalyticsDashboardProps = {
  beds: Bed[];
  patients: Patient[];
  dashboard: DashboardSummary;
};

type PeriodOption = 7 | 15 | 30 | 90 | 180 | 365;
type PatientFilter = "all" | "vm" | "tracheostomy" | "recent-extubation" | "non-invasive";

const PERIOD_OPTIONS: Array<{ label: string; value: PeriodOption }> = [
  { label: "7 dias", value: 7 },
  { label: "15 dias", value: 15 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "180 dias", value: 180 },
  { label: "365 dias", value: 365 }
];

const PATIENT_FILTER_OPTIONS: Array<{ label: string; value: PatientFilter }> = [
  { label: "Todos os pacientes", value: "all" },
  { label: "Em ventilacao mecanica", value: "vm" },
  { label: "Traqueostomia", value: "tracheostomy" },
  { label: "Pos-extubacao", value: "recent-extubation" },
  { label: "Sem suporte invasivo", value: "non-invasive" }
];

const SUPPORT_COLORS = ["#1d4ed8", "#0f766e", "#d97706", "#9333ea", "#dc2626", "#64748b"];
const ALERT_COLORS = ["#dc2626", "#f59e0b", "#2563eb", "#0f766e", "#7c3aed"];
const ORIGIN_COLORS = ["#0f766e", "#d97706", "#2563eb", "#9333ea", "#64748b"];

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function formatDateTime(value: string | null | undefined) {
  const parsed = parseDate(value);

  if (!parsed) {
    return "Nao informado";
  }

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function getPeriodLabel(period: PeriodOption) {
  if (period === 7) {
    return "Ultimos 7 dias";
  }

  if (period === 15) {
    return "Ultimos 15 dias";
  }

  if (period === 30) {
    return "Ultimos 30 dias";
  }

  if (period === 90) {
    return "Ultimos 90 dias";
  }

  if (period === 180) {
    return "Ultimos 180 dias";
  }

  return "Ultimos 365 dias";
}

function isMechanicalVentilationPatient(patient: Patient) {
  return isMechanicalVentilationType(patient.ventilatorySupport.type);
}

function isRecentExtubationPatient(patient: Patient) {
  return patient.stayMetrics?.extubationHours !== null && (patient.stayMetrics?.extubationHours ?? 0) <= 72;
}

function matchesPatientFilter(patient: Patient, filter: PatientFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "vm") {
    return isMechanicalVentilationPatient(patient);
  }

  if (filter === "tracheostomy") {
    return normalizeVentilatorySupportType(patient.ventilatorySupport.type) === "traqueostomia";
  }

  if (filter === "recent-extubation") {
    return isRecentExtubationPatient(patient);
  }

  if (filter === "non-invasive") {
    return !["vmi", "traqueostomia"].includes(normalizeVentilatorySupportType(patient.ventilatorySupport.type));
  }

  return true;
}

function parseLabNumber(value: string) {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);

  if (!match) {
    return null;
  }

  return Number.parseFloat(match[0].replace(",", "."));
}

function formatMetric(value: number, suffix = "") {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1
  })}${suffix}`;
}

function formatAlertCategory(alert: string) {
  const normalized = alert.toLowerCase();

  if (normalized.includes("filtro")) {
    return "Filtro";
  }

  if (normalized.includes("gasometr")) {
    return "Gasometria";
  }

  if (normalized.includes("radiografia") || normalized.includes("rx") || normalized.includes("tomografia")) {
    return "Imagem";
  }

  if (normalized.includes("broncoasp") || normalized.includes("higiene")) {
    return "Via aerea";
  }

  if (normalized.includes("desmame") || normalized.includes("dispneia") || normalized.includes("fadiga")) {
    return "Desmame";
  }

  return "Outros";
}

function getPatientBedLabel(patient: Patient) {
  return patient.bedCode ?? patient.lastBedCode ?? "Sem leito ativo";
}

export default function AnalyticsDashboard({ beds, patients, dashboard }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<PeriodOption>(7);
  const [patientFilter, setPatientFilter] = useState<PatientFilter>("all");

  const activePatients = patients.filter((patient) => patient.discharge === null);
  const now = new Date();
  const filterStart = addDays(startOfDay(now), -(period - 1));
  const patientsInPeriod = activePatients.filter((patient) => {
    const admissionDate = parseDate(patient.admissionDate);
    return Boolean(admissionDate && startOfDay(admissionDate) >= filterStart);
  });
  const filteredPatients = patientsInPeriod.filter((patient) => matchesPatientFilter(patient, patientFilter));
  const periodLabel = getPeriodLabel(period);

  const occupancyRate = beds.length === 0 ? 0 : (filteredPatients.length / beds.length) * 100;
  const vmPatients = filteredPatients.filter(isMechanicalVentilationPatient);
  const totalAlerts = filteredPatients.reduce((sum, patient) => sum + patient.respiratoryAlerts.length, 0);
  const averageStay =
    filteredPatients.length === 0
      ? 0
      : filteredPatients.reduce((sum, patient) => sum + (patient.stayMetrics?.ctiDays ?? 0), 0) / filteredPatients.length;
  const overdueFilters = filteredPatients.filter((patient) => patient.filterStatus.isOverdue).length;
  const preventiveFilters = filteredPatients.filter((patient) => patient.filterStatus.isPreventive).length;
  const originStats = dashboard.originStats ?? [];
  const populatedOriginStats = originStats.filter((item) => item.total > 0);
  const averageAgeByOrigin = dashboard.averageAgeByOrigin ?? [];
  const populatedAverageAgeByOrigin = averageAgeByOrigin.filter((item) => item.averageAge > 0);
  const topOrigin = [...populatedOriginStats].sort((left, right) => right.total - left.total)[0];

  const occupancyTimeline = Array.from({ length: period }, (_, index) => {
    const day = addDays(filterStart, index);
    const occupiedCount = patientsInPeriod.filter((patient) => {
      const admission = parseDate(patient.admissionDate);
      const discharge = parseDate(patient.discharge?.dateTime);

      return Boolean(
        admission &&
          admission <= day &&
          (!discharge || startOfDay(discharge).getTime() > day.getTime())
      );
    }).length;

    return {
      date: formatShortDate(day),
      ocupacao: occupiedCount,
      taxa: beds.length === 0 ? 0 : Number(((occupiedCount / beds.length) * 100).toFixed(1))
    };
  });

  const supportDistribution = filteredPatients
    .reduce<Array<{ name: string; value: number }>>((accumulator, patient) => {
      const supportName = getVentilatorySupportLabel(patient.ventilatorySupport.type);
      const item = accumulator.find((entry) => entry.name === supportName);

      if (item) {
        item.value += 1;
      } else {
        accumulator.push({ name: supportName, value: 1 });
      }

      return accumulator;
    }, [])
    .sort((left, right) => right.value - left.value);

  const stayDistribution = [...filteredPatients]
    .sort((left, right) => (right.stayMetrics?.ctiDays ?? 0) - (left.stayMetrics?.ctiDays ?? 0))
    .slice(0, 8)
    .map((patient) => ({
      name: patient.name.split(" ").slice(0, 2).join(" "),
      dias: patient.stayMetrics?.ctiDays ?? 0,
      suporte: formatVentilatorySupport(patient.ventilatorySupport)
    }));

  const patientProfile = filteredPatients.map((patient) => ({
    x: patient.age,
    y: patient.stayMetrics?.ctiDays ?? 0,
    z: Math.max(120, patient.respiratoryAlerts.length * 60 + 120),
    name: patient.name,
    diagnosis: patient.diagnosis,
    support: formatVentilatorySupport(patient.ventilatorySupport)
  }));

  const diagnosisDistribution = filteredPatients
    .reduce<Array<{ diagnosis: string; total: number }>>((accumulator, patient) => {
      const diagnosis = accumulator.find((item) => item.diagnosis === patient.diagnosis);

      if (diagnosis) {
        diagnosis.total += 1;
      } else {
        accumulator.push({ diagnosis: patient.diagnosis, total: 1 });
      }

      return accumulator;
    }, [])
    .sort((left, right) => right.total - left.total)
    .slice(0, 5);

  const labAverageByDay = filteredPatients
    .flatMap((patient) => patient.labs)
    .filter((lab) => {
      const parsed = parseDate(lab.date);
      return Boolean(parsed && parsed >= filterStart);
    })
    .reduce<Record<string, { count: number; pcr: number; cr: number; ac: number }>>((accumulator, lab) => {
      const parsed = parseDate(lab.date);

      if (!parsed) {
        return accumulator;
      }

      const key = parsed.toISOString().slice(0, 10);
      const current = accumulator[key] ?? { count: 0, pcr: 0, cr: 0, ac: 0 };
      const pcr = parseLabNumber(lab.pcr);
      const cr = parseLabNumber(lab.cr);
      const ac = parseLabNumber(lab.ac);

      accumulator[key] = {
        count: current.count + 1,
        pcr: current.pcr + (pcr ?? 0),
        cr: current.cr + (cr ?? 0),
        ac: current.ac + (ac ?? 0)
      };

      return accumulator;
    }, {});

  const labAverages = Object.entries(labAverageByDay)
    .map(([date, values]) => {
      const parsed = parseDate(date);

      return {
        sortKey: date,
        date: parsed ? formatShortDate(parsed) : date,
        pcr: Number((values.pcr / values.count).toFixed(1)),
        creatinina: Number((values.cr / values.count).toFixed(2)),
        lactato: Number((values.ac / values.count).toFixed(2))
      };
    })
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey));

  const alertDistribution = filteredPatients
    .flatMap((patient) => patient.respiratoryAlerts)
    .reduce<Array<{ type: string; total: number }>>((accumulator, alert) => {
      const category = formatAlertCategory(alert);
      const item = accumulator.find((entry) => entry.type === category);

      if (item) {
        item.total += 1;
      } else {
        accumulator.push({ type: category, total: 1 });
      }

      return accumulator;
    }, [])
    .sort((left, right) => right.total - left.total);

  const topAlertPatients = [...filteredPatients]
    .sort((left, right) => right.respiratoryAlerts.length - left.respiratoryAlerts.length)
    .slice(0, 5);

  const criticalInsights = [
    `${vmPatients.length} pacientes no recorte estao em ventilacao mecanica.`,
    `${overdueFilters} filtros vencidos e ${preventiveFilters} em janela preventiva.`,
    topOrigin
      ? `${topOrigin.label} lidera as admissoes com ${topOrigin.total} pacientes.`
      : "Sem dados de origem consolidados ate o momento."
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Passagem de Plantao</span>
          <h1 className={styles.title}>Gestao Inteligente de CTI</h1>
          <p className={styles.subtitle}>
            Analytics operacional com indicadores respiratorios, ocupacao,
            permanencia e tendencia laboratorial usando os dados reais do sistema em memoria.
          </p>
          <span className={styles.periodBadge}>{periodLabel}</span>
        </div>

        <div className={styles.heroActions}>
          <div className={styles.contextCard}>
            <span className={styles.contextLabel}>Snapshot mensal</span>
            <strong>{dashboard.month}</strong>
            <span>Tempo medio historico: {formatMetric(dashboard.averageLengthOfStay, " dias")}</span>
          </div>
          <Link href="/dashboard" className={styles.backLink}>
            Voltar ao dashboard
          </Link>
        </div>
      </section>

      <section className={styles.filters}>
        <div className={styles.segmented}>
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === period ? styles.segmentActive : styles.segment}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className={styles.selectWrapper}>
          <span>Tipo de paciente</span>
          <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value as PatientFilter)}>
            {PATIENT_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Taxa de ocupacao</span>
          <strong className={styles.metricValue}>{formatMetric(occupancyRate, "%")}</strong>
          <p>{filteredPatients.length} pacientes admitidos no periodo para {beds.length} leitos monitorados.</p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Pacientes internados</span>
          <strong className={styles.metricValue}>{filteredPatients.length}</strong>
          <p>Pacientes com admissao dentro de {periodLabel.toLowerCase()}.</p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Pacientes em VM</span>
          <strong className={styles.metricValue}>{vmPatients.length}</strong>
          <p>VMI e VNI agrupadas como ventilacao mecanica.</p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Tempo medio de permanencia</span>
          <strong className={styles.metricValue}>{formatMetric(averageStay, " dias")}</strong>
          <p>Media de internacao no CTI no recorte filtrado.</p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Alertas ativos</span>
          <strong className={styles.metricValue}>{totalAlerts}</strong>
          <p>Alertas respiratorios e operacionais associados aos pacientes.</p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Idade media das internacoes</span>
          <strong className={styles.metricValue}>{formatMetric(dashboard.averageAdmissionAge ?? 0, " anos")}</strong>
          <p>Media consolidada considerando todas as internacoes registradas.</p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Origem predominante</span>
          <strong className={styles.metricValue}>{topOrigin?.label ?? "Nao informado"}</strong>
          <p>{topOrigin ? `${topOrigin.total} internacoes (${topOrigin.percentage}%)` : "Sem dados de origem."}</p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Ocupacao ao longo do tempo</h2>
              <p>Historico sintetico considerando admissoes dentro de {periodLabel.toLowerCase()}.</p>
            </div>
          </div>
          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={occupancyTimeline}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="ocupacao" name="Leitos ocupados" stroke="#1d4ed8" fill="url(#occupancyGradient)" strokeWidth={3} />
                <Line type="monotone" dataKey="taxa" name="Taxa %" stroke="#0f766e" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Suporte ventilatorio</h2>
              <p>Distribuicao dos pacientes pelo suporte atual.</p>
            </div>
          </div>
          {supportDistribution.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supportDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {supportDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={SUPPORT_COLORS[index % SUPPORT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Nenhum paciente no recorte atual para distribuir por suporte.</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Internacoes por origem</h2>
              <p>Distribuicao consolidada das admissoes registradas.</p>
            </div>
          </div>
          {populatedOriginStats.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={populatedOriginStats} dataKey="total" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={4}>
                    {populatedOriginStats.map((entry, index) => (
                      <Cell key={entry.origin} fill={ORIGIN_COLORS[index % ORIGIN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Nenhuma internacao com origem informada ate o momento.</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Percentual por origem</h2>
              <p>Percentual relativo das internacoes por porta de entrada.</p>
            </div>
          </div>
          {populatedOriginStats.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={populatedOriginStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value}%`, "Percentual"]} />
                  <Bar dataKey="percentage" name="Percentual" radius={[10, 10, 0, 0]}>
                    {populatedOriginStats.map((entry, index) => (
                      <Cell key={entry.origin} fill={ORIGIN_COLORS[index % ORIGIN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Sem percentual por origem para exibir.</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Tempo de internacao no CTI</h2>
              <p>Pacientes com maior permanencia no recorte.</p>
            </div>
          </div>
          {stayDistribution.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stayDistribution} layout="vertical" margin={{ left: 16, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} />
                  <Tooltip />
                  <Bar dataKey="dias" name="Dias de permanencia" radius={[0, 10, 10, 0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Sem pacientes no recorte atual para calcular permanencia.</div>
          )}
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Perfil dos pacientes</h2>
              <p>Idade versus permanencia, com diagnostico no tooltip.</p>
            </div>
          </div>
          {patientProfile.length > 0 ? (
            <>
              <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                    <XAxis type="number" dataKey="x" name="Idade" tickLine={false} axisLine={false} unit=" anos" />
                    <YAxis type="number" dataKey="y" name="Dias CTI" tickLine={false} axisLine={false} unit=" dias" />
                    <ZAxis type="number" dataKey="z" range={[120, 420]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => [value, name]}
                      contentStyle={{ borderRadius: 16, borderColor: "#dbe4f0" }}
                    />
                    <Scatter data={patientProfile} name="Pacientes" fill="#d97706" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.supportingGrid}>
                {diagnosisDistribution.map((item) => (
                  <div key={item.diagnosis} className={styles.miniStat}>
                    <span>{item.diagnosis}</span>
                    <strong>{item.total}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>Sem pacientes suficientes para montar o perfil do recorte.</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Media de idade por origem</h2>
              <p>Comparativo etario por origem das internacoes.</p>
            </div>
          </div>
          {populatedAverageAgeByOrigin.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={populatedAverageAgeByOrigin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} anos`, "Idade media"]} />
                  <Bar dataKey="averageAge" name="Idade media" radius={[10, 10, 0, 0]} fill="#1d4ed8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Ainda nao ha idade media consolidada por origem.</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Medias laboratoriais</h2>
              <p>PCR, creatinina e lactato agregados por dia.</p>
            </div>
          </div>
          {labAverages.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={labAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pcr" name="PCR" stroke="#dc2626" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="creatinina" name="Creatinina" stroke="#2563eb" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="lactato" name="Lactato" stroke="#7c3aed" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Nenhum exame laboratorial no periodo selecionado.</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Alertas por tipo</h2>
              <p>Total ativo: {totalAlerts} alertas em {periodLabel.toLowerCase()}.</p>
            </div>
          </div>
          {alertDistribution.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis dataKey="type" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Alertas" radius={[10, 10, 0, 0]}>
                    {alertDistribution.map((entry, index) => (
                      <Cell key={entry.type} fill={ALERT_COLORS[index % ALERT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>Nenhum alerta ativo encontrado no periodo filtrado.</div>
          )}
        </article>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Insights automatizados</h2>
              <p>Leitura rapida para rounds e discussoes do plantao.</p>
            </div>
          </div>
          <div className={styles.insightList}>
            {criticalInsights.map((insight) => (
              <div key={insight} className={styles.insightItem}>
                {insight}
              </div>
            ))}
            <div className={styles.statusStrip}>
              <span>Historico mensal de alertas: {dashboard.activeAlerts}</span>
              <span>Exames registrados: {dashboard.examsRegistered}</span>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Pacientes em foco</h2>
              <p>Alertas respiratorios e status do filtro.</p>
            </div>
          </div>
          <div className={styles.patientList}>
            {topAlertPatients.map((patient) => (
              <Link key={patient.id} href={`/patients/${patient.id}`} className={styles.patientRow}>
                <div>
                  <strong>{patient.name}</strong>
                  <span>{getPatientBedLabel(patient)} - {formatVentilatorySupport(patient.ventilatorySupport)}</span>
                </div>
                <div className={styles.patientMeta}>
                  <span>{patient.respiratoryAlerts.length} alertas</span>
                  <small>{patient.filterStatus.label}</small>
                </div>
              </Link>
            ))}

            {topAlertPatients.length === 0 ? (
              <div className={styles.emptyState}>Nenhum paciente ativo encontrado para o filtro atual.</div>
            ) : null}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelAccent}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Controle de filtro</h2>
              <p>Pacientes com janela respiratoria mais critica.</p>
            </div>
          </div>
          <div className={styles.filterList}>
            {filteredPatients
              .filter((patient) => patient.filterStatus.nextFilterChangeDateTime)
              .sort((left, right) => {
                const leftHours = left.filterStatus.hoursUntilNextChange ?? Number.POSITIVE_INFINITY;
                const rightHours = right.filterStatus.hoursUntilNextChange ?? Number.POSITIVE_INFINITY;
                return leftHours - rightHours;
              })
              .slice(0, 4)
              .map((patient) => (
                <div key={patient.id} className={styles.filterRow}>
                  <div>
                    <strong>{patient.name}</strong>
                    <span>Ultima troca: {formatDateTime(patient.filterStatus.lastFilterChangeDateTime)}</span>
                  </div>
                  <div className={styles.filterMeta}>
                    <strong>{patient.filterStatus.label}</strong>
                    <span>Proxima: {formatDateTime(patient.filterStatus.nextFilterChangeDateTime)}</span>
                  </div>
                </div>
              ))}

            {filteredPatients.filter((patient) => patient.filterStatus.nextFilterChangeDateTime).length === 0 ? (
              <div className={styles.emptyState}>Sem pacientes com janela de troca de filtro monitorada.</div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
