import { beds, patients } from "../data/mockData.js";

const dischargeTypes = [
  "alta para casa",
  "transferencia para quarto",
  "transferencia",
  "obito"
];

function toDate(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    typeof value === "string" && value.length === 10
      ? `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`
      : value;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function diffInDays(fromValue, toValue = new Date()) {
  const fromDate = toDate(fromValue);
  const endDate = toDate(toValue) ?? toValue;

  if (!fromDate || !endDate || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return Math.max(1, Math.ceil((endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function diffInHours(fromValue, toValue) {
  const fromDate = toDate(fromValue);
  const endDate = toDate(toValue);

  if (!fromDate || !endDate) {
    return null;
  }

  return Math.max(0, Math.ceil((endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60)));
}

function buildFilterStatus(lastFilterChangeDateTime) {
  if (!lastFilterChangeDateTime) {
    return {
      lastFilterChangeDateTime: null,
      nextFilterChangeDateTime: null,
      status: "nao_aplicavel",
      label: "Sem filtro monitorado",
      hoursUntilNextChange: null,
      isOverdue: false,
      isPreventive: false
    };
  }

  const lastChange = toDate(lastFilterChangeDateTime);

  if (!lastChange) {
    return {
      lastFilterChangeDateTime,
      nextFilterChangeDateTime: null,
      status: "indefinido",
      label: "Data de filtro invalida",
      hoursUntilNextChange: null,
      isOverdue: false,
      isPreventive: false
    };
  }

  const nextChange = new Date(lastChange.getTime() + 3 * 24 * 60 * 60 * 1000);
  const hoursUntilNextChange = Math.ceil((nextChange.getTime() - Date.now()) / (1000 * 60 * 60));
  const isOverdue = hoursUntilNextChange < 0;
  const isPreventive = !isOverdue && hoursUntilNextChange < 24;

  return {
    lastFilterChangeDateTime: lastChange.toISOString(),
    nextFilterChangeDateTime: nextChange.toISOString(),
    status: isOverdue ? "vencido" : isPreventive ? "preventivo" : "ok",
    label: isOverdue ? "Troca de filtro vencida" : isPreventive ? "Troca de filtro em menos de 24h" : "Filtro dentro do prazo",
    hoursUntilNextChange,
    isOverdue,
    isPreventive
  };
}

function buildCalculatedFields(patient) {
  const now = new Date();
  const extubationDate = patient.respiratoryTimeline?.extubationDate;
  const iotDate = patient.respiratoryTimeline?.iotDate;
  const tqtDate = patient.respiratoryTimeline?.tqtDate;
  const vmStartDate = patient.respiratoryTimeline?.mechanicalVentilationStartDate;
  const iotEndReference = extubationDate ?? now.toISOString();
  const filterStatus = buildFilterStatus(patient.filterControl?.lastFilterChangeDateTime ?? null);
  const respiratoryAlerts = [...patient.alerts];

  if (filterStatus.isOverdue || filterStatus.isPreventive) {
    respiratoryAlerts.push(filterStatus.label);
  }

  return {
    stayMetrics: {
      hospitalDays: diffInDays(patient.hospitalAdmissionDate, now.toISOString()),
      ctiDays: diffInDays(patient.ctiAdmissionDate, now.toISOString()),
      mechanicalVentilationDays:
        patient.mechanicalVentilation || patient.ventilatorySupport === "VMI"
          ? diffInDays(vmStartDate, now.toISOString())
          : null,
      iotDays: iotDate ? diffInDays(iotDate, iotEndReference) : null,
      tqtDays: tqtDate ? diffInDays(tqtDate, now.toISOString()) : null,
      extubationHours: extubationDate ? diffInHours(extubationDate, now.toISOString()) : null,
      extubationDays: extubationDate ? diffInDays(extubationDate, now.toISOString()) : null
    },
    filterStatus,
    respiratoryAlerts
  };
}

function enrichPatientRecord(patient) {
  return {
    ...patient,
    ...buildCalculatedFields(patient)
  };
}

export function getPatients() {
  return patients.map(enrichPatientRecord);
}

export function getPatientById(id) {
  const patient = patients.find((currentPatient) => currentPatient.id === Number(id));
  return patient ? enrichPatientRecord(patient) : null;
}

function getPatientRecordById(id) {
  return patients.find((patient) => patient.id === Number(id));
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const dailyLabFields = ["hb", "ht", "leuco", "bt", "plq", "ur", "cr", "pcr", "na", "k", "ca", "ac"];

function normalizeDailyLabRecord(data) {
  return {
    date: normalizeText(data.date),
    hb: normalizeText(data.hb),
    ht: normalizeText(data.ht),
    leuco: normalizeText(data.leuco),
    bt: normalizeText(data.bt),
    plq: normalizeText(data.plq),
    ur: normalizeText(data.ur),
    cr: normalizeText(data.cr),
    pcr: normalizeText(data.pcr),
    na: normalizeText(data.na),
    k: normalizeText(data.k),
    ca: normalizeText(data.ca),
    ac: normalizeText(data.ac),
    extraExamName: normalizeText(data.extraExamName),
    extraExamValue: normalizeText(data.extraExamValue)
  };
}

function validateDailyLabRecord(record) {
  if (!record.date) {
    throw new Error("Data do exame obrigatoria.");
  }

  const parsedDate = new Date(`${record.date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Data do exame invalida.");
  }

  if (record.extraExamName && !record.extraExamValue) {
    throw new Error("Informe o valor do exame extra.");
  }

  if (!record.extraExamName && record.extraExamValue) {
    throw new Error("Informe o nome do exame extra.");
  }
}

function validatePatientData(data) {
  const requiredFields = [
    "name",
    "recordNumber",
    "age",
    "diagnosis",
    "bedId",
    "admissionDate",
    "ventilatorySupport",
    "mobilityLevel"
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = data[field];

    if (typeof value === "string") {
      return !value.trim();
    }

    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw new Error(`Campos obrigatorios: ${missingFields.join(", ")}`);
  }

  const age = Number(data.age);

  if (!Number.isInteger(age) || age <= 0) {
    throw new Error("Idade invalida. Informe um numero inteiro maior que zero.");
  }

  const bedId = Number(data.bedId);

  if (!Number.isInteger(bedId) || bedId <= 0) {
    throw new Error("Leito invalido.");
  }

  const bed = beds.find((currentBed) => currentBed.id === bedId);

  if (!bed) {
    throw new Error("Leito nao encontrado.");
  }

  const duplicatedRecord = patients.some(
    (patient) => patient.recordNumber.toLowerCase() === normalizeText(data.recordNumber).toLowerCase()
  );

  if (duplicatedRecord) {
    throw new Error("Ja existe um paciente com este prontuario.");
  }
}

export function createPatient(data) {
  validatePatientData(data);

  const bedId = Number(data.bedId);
  const bed = beds.find((currentBed) => currentBed.id === bedId);

  if (!bed || bed.occupied || bed.patientId) {
    throw new Error("Leito indisponivel para admissao.");
  }

  const nextId = Math.max(...patients.map((patient) => patient.id), 0) + 1;
  const patient = {
    id: nextId,
    name: normalizeText(data.name),
    recordNumber: normalizeText(data.recordNumber),
    age: Number(data.age),
    diagnosis: normalizeText(data.diagnosis),
    bedId,
    lastBedId: bedId,
    hospitalAdmissionDate: data.admissionDate,
    ctiAdmissionDate: data.admissionDate,
    admissionDate: data.admissionDate,
    ventilatorySupport: normalizeText(data.ventilatorySupport),
    mobilityLevel: normalizeText(data.mobilityLevel),
    respiratoryTimeline: {
      mechanicalVentilationStartDate:
        normalizeText(data.ventilatorySupport) === "VMI" ? `${data.admissionDate}T08:00:00` : null,
      iotDate: normalizeText(data.ventilatorySupport) === "VMI" ? `${data.admissionDate}T08:00:00` : null,
      tqtDate: normalizeText(data.ventilatorySupport) === "Traqueostomia" ? `${data.admissionDate}T08:00:00` : null,
      extubationDate: null
    },
    filterControl: {
      lastFilterChangeDateTime:
        normalizeText(data.ventilatorySupport) === "VMI" || normalizeText(data.ventilatorySupport) === "Traqueostomia"
          ? `${data.admissionDate}T09:00:00`
          : null
    },
    reasonForAdmission: normalizeText(data.diagnosis),
    clinicalHistory: {
      antecedentes: ["Sem antecedentes relevantes registrados."],
      comorbidities: ["Sem comorbidades registradas."],
      intercurrences: ["Sem intercorrencias nas ultimas 24 horas."],
      clinicalAlerts: []
    },
    mechanicalVentilation:
      normalizeText(data.ventilatorySupport) === "VMI" || normalizeText(data.ventilatorySupport) === "Traqueostomia"
        ? {
            typeOfSupport:
              normalizeText(data.ventilatorySupport) === "VMI"
                ? "Ventilacao mecanica invasiva"
                : "Via aerea artificial",
            airway: normalizeText(data.ventilatorySupport) === "Traqueostomia" ? "Traqueostomia" : "Orotraqueal",
            totTqt: normalizeText(data.ventilatorySupport) === "Traqueostomia" ? "TQT" : "TOT",
            ventilatoryMode: "A definir",
            fio2: "A definir",
            peep: "A definir",
            tidalVolume: "A definir",
            inspiratoryPressure: "A definir",
            programmedRespiratoryRate: "A definir",
            cuff: "A definir",
            observations: ""
          }
        : null,
    restrictions: {
      motor: ["Sem restricoes motoras adicionais."],
      respiratory: ["Sem restricoes respiratorias adicionais."],
      mobilization: ["Mobilizacao conforme tolerancia hemodinamica."],
      isolation: "Sem isolamento",
      contraindications: ["Sem contraindicacoes absolutas registradas."]
    },
    physiotherapyPlan: {
      respiratoryEvolution: `Manter acompanhamento respiratorio para ${normalizeText(data.ventilatorySupport)}.`,
      motorEvolution: `Progressao motora conforme nivel atual: ${normalizeText(data.mobilityLevel)}.`,
      conducts: ["Monitorizacao fisioterapeutica diaria", "Reavaliacao funcional por plantao"],
      patientResponse: "Resposta inicial ainda em observacao."
    },
    discharge: null,
    alerts: [],
    labs: [],
    bloodGas: [],
    imaging: [],
    evolutions: []
  };

  patients.push(patient);
  bed.occupied = true;
  bed.status = "Estavel";
  bed.patientId = patient.id;
  bed.alertCount = 0;

  return enrichPatientRecord(patient);
}

export function getPatientLabs(patientId) {
  const patient = getPatientRecordById(patientId);

  if (!patient) {
    throw new Error("Paciente nao encontrado.");
  }

  return [...patient.labs]
    .map((lab, index) => ({
      id: lab.id ?? index + 1,
      ...normalizeDailyLabRecord(lab)
    }))
    .sort((firstLab, secondLab) => {
      const dateCompare = secondLab.date.localeCompare(firstLab.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return secondLab.id - firstLab.id;
    });
}

export function createPatientLab(patientId, data) {
  const numericPatientId = Number(patientId);

  if (!Number.isInteger(numericPatientId) || numericPatientId <= 0) {
    throw new Error("Paciente invalido.");
  }

  const patient = getPatientRecordById(numericPatientId);

  if (!patient) {
    throw new Error("Paciente nao encontrado.");
  }

  const normalizedRecord = normalizeDailyLabRecord(data);
  validateDailyLabRecord(normalizedRecord);

  const duplicatedDate = patient.labs.some((lab) => lab.date === normalizedRecord.date);

  if (duplicatedDate) {
    throw new Error("Ja existe registro laboratorial para esta data.");
  }

  const nextId =
    Math.max(0, ...patients.flatMap((currentPatient) => currentPatient.labs.map((lab) => lab.id ?? 0))) + 1;
  const createdLab = {
    id: nextId,
    ...normalizedRecord
  };

  patient.labs.unshift(createdLab);

  return createdLab;
}

export function updatePatientLab(patientId, labId, data) {
  const patient = getPatientRecordById(patientId);

  if (!patient) {
    throw new Error("Paciente nao encontrado.");
  }

  const numericLabId = Number(labId);
  const labIndex = patient.labs.findIndex((lab) => lab.id === numericLabId);

  if (labIndex === -1) {
    throw new Error("Registro laboratorial nao encontrado.");
  }

  const normalizedRecord = normalizeDailyLabRecord(data);
  validateDailyLabRecord(normalizedRecord);

  const duplicatedDate = patient.labs.some(
    (lab, index) => index !== labIndex && lab.date === normalizedRecord.date
  );

  if (duplicatedDate) {
    throw new Error("Ja existe registro laboratorial para esta data.");
  }

  const updatedLab = {
    id: numericLabId,
    ...normalizedRecord
  };

  patient.labs[labIndex] = updatedLab;

  return updatedLab;
}

export function deletePatientLab(patientId, labId) {
  const patient = getPatientRecordById(patientId);

  if (!patient) {
    throw new Error("Paciente nao encontrado.");
  }

  const numericLabId = Number(labId);
  const labIndex = patient.labs.findIndex((lab) => lab.id === numericLabId);

  if (labIndex === -1) {
    throw new Error("Registro laboratorial nao encontrado.");
  }

  const [deletedLab] = patient.labs.splice(labIndex, 1);
  return deletedLab;
}

export function dischargePatient(patientId, data) {
  const patient = getPatientRecordById(patientId);

  if (!patient) {
    throw new Error("Paciente nao encontrado.");
  }

  if (!patient.bedId) {
    throw new Error("Paciente ja esta sem leito ativo.");
  }

  const dischargeType = normalizeText(data.type).toLowerCase();
  const dischargeDateTime = normalizeText(data.dateTime);
  const note = normalizeText(data.note);
  const roomNumber = normalizeText(data.roomNumber);
  const roomBed = normalizeText(data.roomBed);
  const destination = normalizeText(data.destination);

  if (!dischargeType || !dischargeDateTime) {
    throw new Error("Campos obrigatorios: type, dateTime");
  }

  if (!dischargeTypes.includes(dischargeType)) {
    throw new Error("Tipo de saida invalido.");
  }

  const parsedDate = new Date(dischargeDateTime);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Data e hora da saida invalida.");
  }

  if (dischargeType === "transferencia para quarto" && !roomNumber) {
    throw new Error("Numero do quarto obrigatorio para transferencia para quarto.");
  }

  if (dischargeType === "transferencia" && !destination) {
    throw new Error("Destino obrigatorio para transferencia.");
  }

  const currentBedId = patient.bedId;
  const bed = beds.find((currentBed) => currentBed.id === currentBedId);

  if (!bed) {
    throw new Error("Leito atual nao encontrado.");
  }

  bed.occupied = false;
  bed.status = "Vago";
  bed.patientId = null;
  bed.alertCount = 0;

  patient.lastBedId = currentBedId;
  patient.bedId = null;
  patient.discharge = {
    type: dischargeType,
    dateTime: parsedDate.toISOString(),
    note,
    destination:
      dischargeType === "transferencia para quarto"
        ? {
            roomNumber,
            roomBed
          }
        : dischargeType === "transferencia"
          ? {
              destination
            }
          : null
  };

  return enrichPatientRecord(patient);
}
