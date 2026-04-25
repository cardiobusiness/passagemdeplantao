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

export type PatientImaging = {
  date: string;
  type: string;
  result: string;
};

export type PatientBloodGas = {
  date: string;
  ph: string;
  pao2: string;
  paco2: string;
  hco3: string;
};

export type FilterTracking = {
  lastChangeDateTime: string | null;
  nextChangeDateTime: string | null;
  status: string;
  label: string;
  isOverdue: boolean;
};

export type VentilatorySupport = {
  type: string;
  label: string;
  flowRate: number | null;
  fio2: number | null;
  temperature: number | null;
  mode: string;
  ipap: number | null;
  epap: number | null;
  peep: number | null;
  tidalVolume: number | null;
  respiratoryRate: number | null;
  pressureSupport: number | null;
  solution: string;
  targetSaturation: number | null;
  summary: string;
};

export type Patient = {
  id: number;
  name: string;
  recordNumber: string;
  age: number;
  diagnosis: string;
  origin?: string | null;
  internalTransferLocation?: string | null;
  bedId: number | null;
  bedCode?: string | null;
  lastBedId: number | null;
  lastBedCode?: string | null;
  admissionDate: string;
  ventilatorySupport: VentilatorySupport;
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
  ventilatorParameters: {
    mode: string;
    fio2: string;
    peep: string;
    pressureSupport: string;
    tidalVolume: string;
    respiratoryRate: string;
    targetSaturation: string;
  };
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
  clinicalNotes: string;
  clinicalUpdatedAt: string | null;
  clinicalUpdatedBy: string;
  filterChanges: {
    ventilatoryFilter: FilterTracking;
    trachCare: FilterTracking;
  };
  complementaryExams: {
    bloodGas: PatientBloodGas[];
    tomography: PatientImaging[];
    other: PatientImaging[];
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
  bloodGas: PatientBloodGas[];
  imaging: PatientImaging[];
  evolutions: Array<{ date: string; type: string; professional: string; note: string }>;
};

export type CreatePatientPayload = Omit<
  Patient,
  | "id"
  | "lastBedId"
  | "lastBedCode"
  | "bedCode"
  | "reasonForAdmission"
  | "clinicalHistory"
  | "mechanicalVentilation"
  | "ventilatorParameters"
  | "restrictions"
  | "physiotherapyPlan"
  | "clinicalNotes"
  | "clinicalUpdatedAt"
  | "clinicalUpdatedBy"
  | "filterChanges"
  | "complementaryExams"
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

export type UpdatePatientClinicalPayload = {
  mechanicalVentilation?: Partial<Patient["mechanicalVentilation"]> | null;
  ventilatorySupport?: Partial<VentilatorySupport> | string;
  ventilatorParameters?: Partial<Patient["ventilatorParameters"]>;
  restrictions?: Partial<Patient["restrictions"]>;
  labs?: Array<Partial<PatientLab>>;
  imaging?: Array<Partial<PatientImaging>>;
  complementaryExams?: Partial<Patient["complementaryExams"]>;
  filterChanges?: {
    ventilatoryFilter?: Partial<FilterTracking>;
    trachCare?: Partial<FilterTracking>;
  };
  filterStatus?: {
    lastFilterChangeDateTime?: string | null;
    trachCare?: { lastChangeDateTime?: string | null };
  };
  clinicalNotes?: string;
  conducts?: string[];
  updatedBy?: string;
};

export type DischargePatientPayload = {
  type: "casa" | "quarto" | "transferencia" | "obito";
  dateTime?: string;
  roomNumber?: string;
  destination?: string;
  notes?: string;
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
  averageAdmissionAge: number;
  originStats: Array<{
    origin: string;
    label: string;
    total: number;
    percentage: number;
  }>;
  averageAgeByOrigin: Array<{
    origin: string;
    label: string;
    averageAge: number;
  }>;
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

export type Handover = {
  id: number;
  professionalId: number;
  bedIds: number[];
  createdAt: string;
};
