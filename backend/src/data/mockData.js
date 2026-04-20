import { createHash } from "node:crypto";

const bedStatuses = ["Estavel", "Atencao", "Alta prevista", "Vago"];

function buildPasswordHash(password, salt) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function createStoredPassword(password, salt) {
  return `${salt}$${buildPasswordHash(password, salt)}`;
}

function buildClinicalHistory(patient, overrides = {}) {
  return {
    antecedentes: overrides.antecedentes ?? ["Sem antecedentes relevantes registrados."],
    comorbidities: overrides.comorbidities ?? ["Sem comorbidades registradas."],
    intercurrences: overrides.intercurrences ?? ["Sem intercorrencias nas ultimas 24 horas."],
    clinicalAlerts: overrides.clinicalAlerts ?? patient.alerts ?? []
  };
}

function buildMechanicalVentilation(overrides = null) {
  if (!overrides) {
    return null;
  }

  return {
    typeOfSupport: overrides.typeOfSupport ?? "",
    airway: overrides.airway ?? "",
    totTqt: overrides.totTqt ?? "",
    ventilatoryMode: overrides.ventilatoryMode ?? "",
    fio2: overrides.fio2 ?? "",
    peep: overrides.peep ?? "",
    tidalVolume: overrides.tidalVolume ?? "",
    inspiratoryPressure: overrides.inspiratoryPressure ?? "",
    programmedRespiratoryRate: overrides.programmedRespiratoryRate ?? "",
    cuff: overrides.cuff ?? "",
    observations: overrides.observations ?? ""
  };
}

function buildRestrictions(overrides = {}) {
  return {
    motor: overrides.motor ?? ["Sem restricoes motoras adicionais."],
    respiratory: overrides.respiratory ?? ["Sem restricoes respiratorias adicionais."],
    mobilization: overrides.mobilization ?? ["Mobilizacao conforme tolerancia hemodinamica."],
    isolation: overrides.isolation ?? "Sem isolamento",
    contraindications: overrides.contraindications ?? ["Sem contraindicacoes absolutas registradas."]
  };
}

function buildPhysiotherapyPlan(patient, overrides = {}) {
  return {
    respiratoryEvolution:
      overrides.respiratoryEvolution ?? `Manter acompanhamento respiratorio para ${patient.ventilatorySupport}.`,
    motorEvolution:
      overrides.motorEvolution ?? `Progressao motora conforme nivel atual: ${patient.mobilityLevel}.`,
    conducts:
      overrides.conducts ?? ["Monitorizacao fisioterapeutica diaria", "Reavaliacao funcional por plantao"],
    patientResponse: overrides.patientResponse ?? "Resposta satisfatoria as condutas instituidas."
  };
}

function enrichPatient(patient) {
  return {
    ...patient,
    hospitalAdmissionDate: patient.hospitalAdmissionDate ?? patient.admissionDate,
    ctiAdmissionDate: patient.ctiAdmissionDate ?? patient.admissionDate,
    respiratoryTimeline: patient.respiratoryTimeline ?? {
      mechanicalVentilationStartDate: null,
      iotDate: null,
      tqtDate: null,
      extubationDate: null
    },
    filterControl: patient.filterControl ?? {
      lastFilterChangeDateTime: null
    },
    reasonForAdmission: patient.reasonForAdmission ?? patient.diagnosis,
    clinicalHistory: buildClinicalHistory(patient, patient.clinicalHistory),
    mechanicalVentilation: buildMechanicalVentilation(patient.mechanicalVentilation),
    restrictions: buildRestrictions(patient.restrictions),
    physiotherapyPlan: buildPhysiotherapyPlan(patient, patient.physiotherapyPlan)
  };
}

export const beds = Array.from({ length: 40 }, (_, index) => {
  const bedNumber = index + 1;
  const occupied = bedNumber % 5 !== 0;

  return {
    id: bedNumber,
    code: `L${100 + bedNumber}`,
    sector: "CTI 1",
    occupied,
    status: occupied ? bedStatuses[bedNumber % 3] : "Vago",
    patientId: occupied ? ((bedNumber - 1) % 8) + 1 : null,
    alertCount: occupied ? (bedNumber % 4 === 0 ? 2 : bedNumber % 3 === 0 ? 1 : 0) : 0
  };
});

const basePatients = [
  {
    id: 1,
    name: "Maria Helena Souza",
    recordNumber: "CTI-1001",
    age: 67,
    diagnosis: "Insuficiencia respiratoria aguda",
    bedId: 1,
    lastBedId: 1,
    hospitalAdmissionDate: "2026-04-06",
    ctiAdmissionDate: "2026-04-10",
    admissionDate: "2026-04-10",
    ventilatorySupport: "VMI",
    mobilityLevel: "Restrito ao leito",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: "2026-04-10T08:30:00",
      iotDate: "2026-04-10T08:30:00",
      tqtDate: null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime: "2026-04-14T09:00:00"
    },
    reasonForAdmission: "Admissao por insuficiencia respiratoria aguda com desconforto importante e hipoxemia.",
    clinicalHistory: {
      antecedentes: ["Tabagismo previo", "Internacao recente por pneumonia comunitaria"],
      comorbidities: ["Hipertensao arterial sistemica", "Diabetes mellitus tipo 2"],
      intercurrences: ["Oscilacao de saturacao durante higiene traqueal", "Secrecao espessa nas ultimas 12h"],
      clinicalAlerts: ["Revisar gasometria arterial", "Nova radiografia pendente"]
    },
    mechanicalVentilation: {
      typeOfSupport: "Ventilacao mecanica invasiva",
      airway: "Orotraqueal",
      totTqt: "TOT",
      ventilatoryMode: "PCV",
      fio2: "40%",
      peep: "8 cmH2O",
      tidalVolume: "420 mL",
      inspiratoryPressure: "18 cmH2O",
      programmedRespiratoryRate: "18 irpm",
      cuff: "Insuflado e aferido",
      observations: "Boa adaptacao ao ventilador, secrecao espessa moderada."
    },
    restrictions: {
      motor: ["Fraqueza global importante", "Dependencia para mudanca de decubito"],
      respiratory: ["Monitorar broncoaspiracao", "Evitar desconexao prolongada do ventilador"],
      mobilization: ["Sedestacao apenas com suporte multiprofissional"],
      isolation: "Contato",
      contraindications: ["Nao realizar ortostatismo hoje"]
    },
    physiotherapyPlan: {
      respiratoryEvolution: "Melhora discreta da complacencia pulmonar nas ultimas 24 horas.",
      motorEvolution: "Mantem baixa tolerancia ao esforco e dependencia total para mobilizacao.",
      conducts: ["Higiene bronquica", "Treino ventilatorio assistido", "Mobilizacao passiva em membros"],
      patientResponse: "Paciente tolerou condutas com boa resposta hemodinamica."
    },
    discharge: null,
    alerts: ["Revisar gasometria arterial", "Nova radiografia pendente"],
    labs: [
      {
        id: 1,
        date: "2026-04-15",
        hb: "11,2",
        ht: "33%",
        leuco: "14.200/mm3",
        bt: "6%",
        plq: "235.000/mm3",
        ur: "41 mg/dL",
        cr: "1,0 mg/dL",
        pcr: "12 mg/L",
        na: "138 mEq/L",
        k: "4,1 mEq/L",
        ca: "8,8 mg/dL",
        ac: "1,9 mmol/L",
        extraExamName: "Mg",
        extraExamValue: "2,0 mg/dL"
      },
      {
        id: 2,
        date: "2026-04-16",
        hb: "10,9",
        ht: "32%",
        leuco: "13.400/mm3",
        bt: "4%",
        plq: "228.000/mm3",
        ur: "39 mg/dL",
        cr: "0,9 mg/dL",
        pcr: "9 mg/L",
        na: "137 mEq/L",
        k: "4,0 mEq/L",
        ca: "8,7 mg/dL",
        ac: "1,6 mmol/L",
        extraExamName: "",
        extraExamValue: ""
      }
    ],
    bloodGas: [
      { date: "2026-04-15", ph: "7.39", pao2: "82", paco2: "38", hco3: "23" }
    ],
    imaging: [
      { date: "2026-04-14", type: "RX Torax", result: "Infiltrado bibasal discreto" }
    ],
    evolutions: [
      {
        date: "2026-04-15 09:30",
        type: "Respiratoria",
        professional: "Dra. Ana Lima",
        note: "Ajuste de higiene brônquica e treino ventilatorio com boa tolerancia."
      },
      {
        date: "2026-04-15 15:00",
        type: "Motora",
        professional: "Dra. Ana Lima",
        note: "Mobilizacao passiva e sedestacao assistida por 12 minutos."
      }
    ]
  },
  {
    id: 2,
    name: "Jose Carlos Nunes",
    recordNumber: "CTI-1002",
    age: 58,
    diagnosis: "Pos-operatorio de cirurgia cardiaca",
    bedId: 2,
    lastBedId: 2,
    hospitalAdmissionDate: "2026-04-09",
    ctiAdmissionDate: "2026-04-11",
    admissionDate: "2026-04-11",
    ventilatorySupport: "Cateter nasal",
    mobilityLevel: "Sedestacao assistida",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: "2026-04-09T14:00:00",
      iotDate: "2026-04-09T14:00:00",
      tqtDate: null,
      extubationDate: "2026-04-12T10:00:00"
    },
    filterControl: {
      lastFilterChangeDateTime: "2026-04-16T07:30:00"
    },
    reasonForAdmission: "Pos-operatorio imediato de cirurgia cardiaca para monitorizacao intensiva.",
    clinicalHistory: {
      antecedentes: ["Doenca arterial coronariana"],
      comorbidities: ["Hipertensao arterial sistemica", "Dislipidemia"],
      intercurrences: ["Dor toracica controlada", "Baixa tolerancia ao esforco inicial"],
      clinicalAlerts: ["Avaliar desmame motor"]
    },
    restrictions: {
      motor: ["Restricao esternal", "Evitar apoio excessivo em membros superiores"],
      respiratory: ["Estimulo de expansao pulmonar frequente"],
      mobilization: ["Progressao cautelosa para marcha"],
      isolation: "Sem isolamento",
      contraindications: ["Evitar manobra de Valsalva"]
    },
    discharge: null,
    alerts: ["Avaliar desmame motor"],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  },
  {
    id: 3,
    name: "Luciana Ferraz",
    recordNumber: "CTI-1003",
    age: 73,
    diagnosis: "AVC isquemico",
    bedId: 3,
    lastBedId: 3,
    hospitalAdmissionDate: "2026-04-07",
    ctiAdmissionDate: "2026-04-09",
    admissionDate: "2026-04-09",
    ventilatorySupport: "Traqueostomia",
    mobilityLevel: "Mobilizacao passiva",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: "2026-04-09T11:00:00",
      iotDate: "2026-04-07T22:00:00",
      tqtDate: "2026-04-13T16:00:00",
      extubationDate: "2026-04-13T16:00:00"
    },
    filterControl: {
      lastFilterChangeDateTime: "2026-04-15T18:00:00"
    },
    reasonForAdmission: "Internacao por AVC isquemico extenso com rebaixamento funcional importante.",
    mechanicalVentilation: {
      typeOfSupport: "Via aerea artificial com suporte umidificado",
      airway: "Traqueostomia",
      totTqt: "TQT",
      ventilatoryMode: "O2 suplementar",
      fio2: "28%",
      peep: "-",
      tidalVolume: "-",
      inspiratoryPressure: "-",
      programmedRespiratoryRate: "-",
      cuff: "Semicuff",
      observations: "Monitorar manejo de secrecao e padrao de degluticao."
    },
    discharge: null,
    alerts: ["Risco de broncoaspiracao"],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  },
  {
    id: 4,
    name: "Paulo Mendes",
    recordNumber: "CTI-1004",
    age: 49,
    diagnosis: "Sepse pulmonar",
    bedId: 4,
    lastBedId: 4,
    hospitalAdmissionDate: "2026-04-11",
    ctiAdmissionDate: "2026-04-13",
    admissionDate: "2026-04-13",
    ventilatorySupport: "VNI",
    mobilityLevel: "Sedestacao",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: null,
      iotDate: null,
      tqtDate: null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime: null
    },
    reasonForAdmission: "Sepse pulmonar com necessidade de suporte respiratorio nao invasivo.",
    discharge: null,
    alerts: [],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  },
  {
    id: 5,
    name: "Sandra Oliveira",
    recordNumber: "CTI-1005",
    age: 64,
    diagnosis: "DPOC exacerbado",
    bedId: 6,
    lastBedId: 6,
    hospitalAdmissionDate: "2026-04-05",
    ctiAdmissionDate: "2026-04-08",
    admissionDate: "2026-04-08",
    ventilatorySupport: "Mascara de Venturi",
    mobilityLevel: "Marcha assistida",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: null,
      iotDate: null,
      tqtDate: null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime: null
    },
    reasonForAdmission: "Exacerbacao de DPOC com necessidade de suplementacao e reabilitacao precoce.",
    discharge: null,
    alerts: ["Monitorar fadiga respiratoria"],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  },
  {
    id: 6,
    name: "Felipe Andrade",
    recordNumber: "CTI-1006",
    age: 37,
    diagnosis: "Trauma toracico",
    bedId: 7,
    lastBedId: 7,
    hospitalAdmissionDate: "2026-04-11",
    ctiAdmissionDate: "2026-04-12",
    admissionDate: "2026-04-12",
    ventilatorySupport: "Ar ambiente",
    mobilityLevel: "Deambulacao parcial",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: null,
      iotDate: null,
      tqtDate: null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime: null
    },
    reasonForAdmission: "Trauma toracico fechado com dor ventilatorio-dependente e vigilancia intensiva.",
    discharge: null,
    alerts: [],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  },
  {
    id: 7,
    name: "Renata Guimaraes",
    recordNumber: "CTI-1007",
    age: 55,
    diagnosis: "Tromboembolismo pulmonar",
    bedId: 8,
    lastBedId: 8,
    hospitalAdmissionDate: "2026-04-12",
    ctiAdmissionDate: "2026-04-14",
    admissionDate: "2026-04-14",
    ventilatorySupport: "Cateter nasal",
    mobilityLevel: "Sedestacao assistida",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: null,
      iotDate: null,
      tqtDate: null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime: null
    },
    reasonForAdmission: "Tromboembolismo pulmonar em monitorizacao e recondicionamento progressivo.",
    discharge: null,
    alerts: ["Reavaliar escala de dispneia"],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  },
  {
    id: 8,
    name: "Roberto Almeida",
    recordNumber: "CTI-1008",
    age: 61,
    diagnosis: "Choque septico",
    bedId: 9,
    lastBedId: 9,
    hospitalAdmissionDate: "2026-04-13",
    ctiAdmissionDate: "2026-04-15",
    admissionDate: "2026-04-15",
    ventilatorySupport: "VMI",
    mobilityLevel: "Restrito ao leito",
    respiratoryTimeline: {
      mechanicalVentilationStartDate: "2026-04-15T05:45:00",
      iotDate: "2026-04-15T05:45:00",
      tqtDate: null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime: "2026-04-16T06:15:00"
    },
    reasonForAdmission: "Choque septico com necessidade de suporte invasivo e vigilancia hemodinamica.",
    mechanicalVentilation: {
      typeOfSupport: "Ventilacao mecanica invasiva",
      airway: "Orotraqueal",
      totTqt: "TOT",
      ventilatoryMode: "VCV",
      fio2: "55%",
      peep: "10 cmH2O",
      tidalVolume: "450 mL",
      inspiratoryPressure: "22 cmH2O",
      programmedRespiratoryRate: "20 irpm",
      cuff: "Insuflado",
      observations: "Paciente ainda dependente de altos niveis de suporte."
    },
    discharge: null,
    alerts: ["Prioridade para higiene bronquica"],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  }
];

export const patients = basePatients.map(enrichPatient);

export const monthlyDashboard = {
  month: "Abril/2026",
  occupancyRate: 82,
  activeAlerts: 17,
  respiratoryEvolutions: 96,
  motorEvolutions: 74,
  averageLengthOfStay: 8.4,
  examsRegistered: 132
};

export const teamUsers = [
  {
    id: 1,
    name: "Administrador Padrao",
    email: "admin@ctiapp.com",
    login: "admin",
    passwordHash: createStoredPassword("Admin@123", "cti-admin-salt"),
    jobTitle: "Administrador do Sistema",
    role: "administrator",
    isActive: true
  },
  {
    id: 2,
    name: "Carla Mendes",
    email: "coordenacao@ctiapp.com",
    login: "coordenador",
    passwordHash: createStoredPassword("Coord@123", "cti-coord-salt"),
    jobTitle: "Coordenadora da Equipe",
    role: "coordinator",
    isActive: true
  },
  {
    id: 3,
    name: "Marcos Vieira",
    email: "rotina@ctiapp.com",
    login: "rotina",
    passwordHash: createStoredPassword("Rotina@123", "cti-rotina-salt"),
    jobTitle: "Fisioterapeuta da Rotina",
    role: "routine",
    isActive: true
  },
  {
    id: 4,
    name: "Ana Lima",
    email: "plantao@ctiapp.com",
    login: "plantonista",
    passwordHash: createStoredPassword("Plantao@123", "cti-plantao-salt"),
    jobTitle: "Fisioterapeuta Plantonista",
    role: "oncall",
    isActive: true
  }
];
