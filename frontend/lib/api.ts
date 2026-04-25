import {
  Bed,
  CreatePatientLabPayload,
  CreatePatientPayload,
  DashboardSummary,
  DischargePatientPayload,
  Handover,
  LoginResponse,
  ResetPasswordPayload,
  Patient,
  PatientLab,
  UpdatePatientClinicalPayload,
  UpdateUserPayload,
  User,
  UserFormPayload
} from "./types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://passagemdeplantao.eletrostarsoft.com.br/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      },
      cache: "no-store"
    });
  } catch {
    throw new Error("Falha de conexao com o backend. Verifique a API, a URL configurada e o CORS.");
  }

  if (!response.ok) {
    let message = `Erro na requisicao: ${response.status}`;

    try {
      const errorPayload = await response.json();

      if (errorPayload?.message) {
        message = errorPayload.message;
      }
    } catch {
      // Keep the fallback message when the backend does not return JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function withAuthorization(token: string, options?: RequestInit): RequestInit {
  return {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${token}`
    }
  };
}

export function login(identifier: string, password: string) {
  const loginUrl = `${apiUrl}/auth/login`;

  console.log("Login API:", loginUrl);

  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
}

export function logout(token: string) {
  return request<void>("/auth/logout", withAuthorization(token, { method: "POST" }));
}

export function getActiveProfessionals(token: string) {
  return request<User[]>("/auth/professionals", withAuthorization(token));
}

export function getBeds() {
  return request<Bed[]>("/beds");
}

export function getPatients() {
  return request<Patient[]>("/patients");
}

export function getPatient(patientId: number) {
  return request<Patient>(`/patients/${patientId}`);
}

export function createPatient(payload: CreatePatientPayload) {
  return request<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePatientClinicalData(patientId: number, payload: UpdatePatientClinicalPayload) {
  return request<Patient>(`/patients/${patientId}/clinical-data`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function getPatientLabs(patientId: number) {
  return request<PatientLab[]>(`/patients/${patientId}/labs`);
}

export function createPatientLab(patientId: number, payload: CreatePatientLabPayload) {
  return request<PatientLab>(`/patients/${patientId}/labs`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePatientLab(patientId: number, labId: number, payload: CreatePatientLabPayload) {
  return request<PatientLab>(`/patients/${patientId}/labs/${labId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePatientLab(patientId: number, labId: number) {
  return request<PatientLab>(`/patients/${patientId}/labs/${labId}`, {
    method: "DELETE"
  });
}

export function dischargePatient(patientId: number, payload: DischargePatientPayload) {
  return request<Patient>(`/patients/${patientId}/discharge`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMonthlyDashboard() {
  return request<DashboardSummary>("/dashboard/monthly");
}

export function getAdminUsers(token: string) {
  return request<User[]>("/admin/users", withAuthorization(token));
}

export function createAdminUser(token: string, payload: UserFormPayload) {
  return request<User>("/admin/users", withAuthorization(token, {
    method: "POST",
    body: JSON.stringify(payload)
  }));
}

export function updateAdminUser(token: string, userId: number, payload: UpdateUserPayload) {
  return request<User>(`/admin/users/${userId}`, withAuthorization(token, {
    method: "PUT",
    body: JSON.stringify(payload)
  }));
}

export function updateAdminUserStatus(token: string, userId: number, isActive: boolean) {
  return request<User>(`/admin/users/${userId}/status`, withAuthorization(token, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  }));
}

export function resetAdminUserPassword(token: string, userId: number, payload: ResetPasswordPayload) {
  return request<User>(`/admin/users/${userId}/reset-password`, withAuthorization(token, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }));
}

export function getHandovers(token: string) {
  return request<Handover[]>("/handovers", withAuthorization(token));
}

export function createHandover(token: string, professionalId: number, bedIds: number[]) {
  return request<Handover>("/handovers", withAuthorization(token, {
    method: "POST",
    body: JSON.stringify({ professionalId, bedIds })
  }));
}
