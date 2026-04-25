import { Patient } from "./types";

export type VentilatorySupportType =
  | "ar_ambiente"
  | "cateter_nasal"
  | "venturi"
  | "alto_fluxo"
  | "macronebulizacao"
  | "vni"
  | "vmi"
  | "traqueostomia"
  | "";

export const VENTILATORY_SUPPORT_OPTIONS: Array<{ value: VentilatorySupportType; label: string }> = [
  { value: "ar_ambiente", label: "Ar ambiente" },
  { value: "cateter_nasal", label: "Cateter nasal" },
  { value: "venturi", label: "Mascara de Venturi" },
  { value: "alto_fluxo", label: "Alto fluxo (HFNC)" },
  { value: "macronebulizacao", label: "Macronebulizacao" },
  { value: "vni", label: "VNI" },
  { value: "vmi", label: "Ventilacao mecanica invasiva" }
];

export function createEmptyVentilatorySupport(type: VentilatorySupportType = "cateter_nasal") {
  return {
    type,
    label: getVentilatorySupportLabel(type),
    flowRate: null,
    fio2: null,
    temperature: null,
    mode: "",
    ipap: null,
    epap: null,
    peep: null,
    tidalVolume: null,
    respiratoryRate: null,
    pressureSupport: null,
    solution: "",
    targetSaturation: null,
    summary: getVentilatorySupportLabel(type)
  };
}

export function normalizeVentilatorySupportType(value: string | null | undefined): VentilatorySupportType {
  const normalized = String(value ?? "").trim().toLowerCase();
  const aliases: Record<string, VentilatorySupportType> = {
    "ar ambiente": "ar_ambiente",
    ar_ambiente: "ar_ambiente",
    "cateter nasal": "cateter_nasal",
    cateter_nasal: "cateter_nasal",
    "mascara de venturi": "venturi",
    "máscara de venturi": "venturi",
    venturi: "venturi",
    "alto fluxo": "alto_fluxo",
    alto_fluxo: "alto_fluxo",
    hfnc: "alto_fluxo",
    "macronebulização": "macronebulizacao",
    macronebulizacao: "macronebulizacao",
    vni: "vni",
    vmi: "vmi",
    "ventilacao mecanica invasiva": "vmi",
    "ventilação mecânica invasiva": "vmi",
    traqueostomia: "traqueostomia"
  };

  return aliases[normalized] ?? "";
}

export function getVentilatorySupportLabel(type: string | null | undefined) {
  const labels: Record<string, string> = {
    ar_ambiente: "Ar ambiente",
    cateter_nasal: "Cateter nasal",
    venturi: "Mascara de Venturi",
    alto_fluxo: "Alto fluxo",
    macronebulizacao: "Macronebulizacao",
    vni: "VNI",
    vmi: "Ventilacao mecanica invasiva",
    traqueostomia: "Traqueostomia"
  };

  return labels[String(type ?? "")] ?? "Nao informado";
}

export function formatVentilatorySupport(support: Patient["ventilatorySupport"] | string | null | undefined) {
  if (!support) {
    return "Nao informado";
  }

  const normalized =
    typeof support === "string"
      ? createEmptyVentilatorySupport(normalizeVentilatorySupportType(support))
      : support;

  if (normalized.summary) {
    return normalized.summary;
  }

  return getVentilatorySupportLabel(normalized.type);
}

export function isMechanicalVentilationType(type: string | null | undefined) {
  const normalized = normalizeVentilatorySupportType(type);
  return normalized === "vmi" || normalized === "vni";
}
