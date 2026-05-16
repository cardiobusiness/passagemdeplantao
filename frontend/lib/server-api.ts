import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ApiRequestError,
  getBeds,
  getMe,
  getMonthlyDashboard,
  getPatient,
  getPatients
} from "./api";
import { Bed, DashboardSummary, Patient, User } from "./types";
import { TOKEN_COOKIE_KEY } from "./auth";

export const emptyDashboard: DashboardSummary = {
  month: "Sem dados",
  occupancyRate: 0,
  activeAlerts: 0,
  respiratoryEvolutions: 0,
  motorEvolutions: 0,
  averageLengthOfStay: 0,
  averageMechanicalVentilationDays: 0,
  reintubationRate: 0,
  extubationRate: 0,
  nonInvasiveVentilationRate: 0,
  averageAdmissionAge: 0,
  originStats: [],
  averageAgeByOrigin: [],
  examsRegistered: 0,
  metrics: {
    totalBeds: 0,
    occupiedBeds: 0,
    totalPatients: 0,
    admissionsThisMonth: 0
  }
};

function getServerToken() {
  return cookies().get(TOKEN_COOKIE_KEY)?.value ?? null;
}

export function isInvalidSessionError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 401 &&
    ["Acesso nao autorizado.", "Sessao invalida ou expirada."].includes(error.message)
  );
}

function redirectOnInvalidSession(error: unknown): never {
  if (isInvalidSessionError(error)) {
    redirect("/");
  }

  throw error;
}

export async function getServerBeds(): Promise<Bed[]> {
  const token = getServerToken();
  try {
    return token ? await getBeds(token) : [];
  } catch (error) {
    redirectOnInvalidSession(error);
  }
}

export async function getServerCurrentUser(): Promise<User | null> {
  const token = getServerToken();
  try {
    return token ? await getMe(token) : null;
  } catch (error) {
    redirectOnInvalidSession(error);
  }
}

export async function getServerPatients(): Promise<Patient[]> {
  const token = getServerToken();
  try {
    return token ? await getPatients(token) : [];
  } catch (error) {
    redirectOnInvalidSession(error);
  }
}

export async function getServerPatient(patientId: number): Promise<Patient> {
  const token = getServerToken();

  if (!token) {
    throw new Error("Sessao nao encontrada.");
  }

  try {
    return await getPatient(patientId, token);
  } catch (error) {
    redirectOnInvalidSession(error);
  }
}

export async function getServerMonthlyDashboard(): Promise<DashboardSummary> {
  const token = getServerToken();
  try {
    return token ? await getMonthlyDashboard(token) : emptyDashboard;
  } catch (error) {
    redirectOnInvalidSession(error);
  }
}
