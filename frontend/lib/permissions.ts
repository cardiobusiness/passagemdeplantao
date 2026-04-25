export const roleLabels: Record<string, string> = {
  administrator: "Administrador",
  coordinator: "Coordenador",
  routine: "Rotina",
  oncall: "Plantonista"
};

export const routeLabels = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  patients: "Pacientes",
  patientCreate: "Novo paciente",
  handover: "Passagem",
  admin: "Administracao"
} as const;

export type AppRouteKey = keyof typeof routeLabels;

const permissionMap: Record<string, AppRouteKey[]> = {
  administrator: ["dashboard", "analytics", "patients", "patientCreate", "handover", "admin"],
  coordinator: ["dashboard", "analytics", "patients", "patientCreate", "handover"],
  routine: ["dashboard", "analytics", "patients", "patientCreate", "handover", "admin"],
  oncall: ["patients", "handover"]
};

export function hasPermission(role: string | null | undefined, route: AppRouteKey) {
  if (!role) {
    return false;
  }

  return permissionMap[role]?.includes(route) ?? false;
}

export function getDefaultRouteForRole(role: string | null | undefined) {
  if (!role) {
    return "/";
  }

  if (hasPermission(role, "dashboard")) {
    return "/dashboard";
  }

  if (hasPermission(role, "patients")) {
    return "/patients";
  }

  if (hasPermission(role, "handover")) {
    return "/handover";
  }

  return "/";
}

export function getRoleLabel(role: string) {
  return roleLabels[role] ?? "Profissional";
}
