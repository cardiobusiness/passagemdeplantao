export type User = {
  id: number;
  name: string;
  email: string;
  login: string;
  jobTitle: string;
  role: string;
  isActive: boolean;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type Patient = {
  id: number;
  name: string;
  recordNumber: string;
  age: number;
  diagnosis: string;
  bedId: number | null;
  lastBedId: number | null;
  admissionDate: string;
  ventilatorySupport: string;
  mobilityLevel: string;
  reasonForAdmission: string;
  clinicalHistory: {
    antecedentes: string[];
    comorbidities: string[];
    intercurrences: string[];
    clinicalAlerts: string[];
  };
  mechanicalVentilation: {
    typeOfSupport: string;
    airway: string;
    totTqt: string;
    ventilatoryMode: string;
    fio2: string;
    peep: string;
    tidalVolume: string;
    inspiratoryPressure: string;
    programmedRespiratoryRate: string;
    cuff: string;
    observations: string;
  } | null;
  restrictions: {
    motor: string[];
    respiratory: string[];
    mobilization: string[];
    isolation: string;
    contraindications: string[];
  };
  physiotherapyPlan: {
    respiratoryEvolution: string;
    motorEvolution: string;
    conducts: string[];
    patientResponse: string;
  };
  discharge: {
    type: string;
    dateTime: string;
    note: string;
    destination: {
      roomNumber?: string;
      roomBed?: string;
      destination?: string;
    } | null;
  } | null;
  stayMetrics: {
    hospitalDays: number | null;
    ctiDays: number | null;
    mechanicalVentilationDays: number | null;
    iotDays: number | null;
    tqtDays: number | null;
    extubationHours: number | null;
    extubationDays: number | null;
  };
  filterStatus: {
    lastFilterChangeDateTime: string | null;
    nextFilterChangeDateTime: string | null;
    status: string;
    label: string;
    hoursUntilNextChange: number | null;
    isOverdue: boolean;
    isPreventive: boolean;
  };
  respiratoryAlerts: string[];
  alerts: string[];
  labs: PatientLab[];
  bloodGas: Array<{ date: string; ph: string; pao2: string; paco2: string; hco3: string }>;
  imaging: Array<{ date: string; type: string; result: string }>;
  evolutions: Array<{ date: string; type: string; professional: string; note: string }>;
};

export type PatientLab = {
  id: number;
  date: string;
  hb: string;
  ht: string;
  leuco: string;
  bt: string;
  plq: string;
  ur: string;
  cr: string;
  pcr: string;
  na: string;
  k: string;
  ca: string;
  ac: string;
  extraExamName: string;
  extraExamValue: string;
};

export type CreatePatientPayload = Omit<
  Patient,
  | "id"
  | "lastBedId"
  | "reasonForAdmission"
  | "clinicalHistory"
  | "mechanicalVentilation"
  | "restrictions"
  | "physiotherapyPlan"
  | "discharge"
  | "stayMetrics"
  | "filterStatus"
  | "respiratoryAlerts"
  | "alerts"
  | "labs"
  | "bloodGas"
  | "imaging"
  | "evolutions"
>;

export type CreatePatientLabPayload = Omit<PatientLab, "id">;

export type DischargePatientPayload = {
  type: string;
  dateTime: string;
  note: string;
  roomNumber: string;
  roomBed: string;
  destination: string;
};

export type Bed = {
  id: number;
  code: string;
  sector: string;
  occupied: boolean;
  status: string;
  patientId: number | null;
  alertCount: number;
  patient: Patient | null;
};

export type DashboardSummary = {
  month: string;
  occupancyRate: number;
  activeAlerts: number;
  respiratoryEvolutions: number;
  motorEvolutions: number;
  averageLengthOfStay: number;
  examsRegistered: number;
};

export type UserFormPayload = {
  name: string;
  email: string;
  login: string;
  password: string;
  jobTitle: string;
  role: string;
  isActive: boolean;
};

export type UpdateUserPayload = Omit<UserFormPayload, "password">;

export type ResetPasswordPayload = {
  password: string;
};
