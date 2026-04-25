import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function buildPasswordHash(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function createStoredPassword(password: string, salt: string): string {
  return `${salt}$${buildPasswordHash(password, salt)}`;
}

function hashPassword(password: string): string {
  const salt = randomBytes(12).toString("hex");
  return createStoredPassword(password, salt);
}

async function main() {
  console.log("Iniciando seed do banco de dados...");

  await prisma.handover.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.evolution.deleteMany();
  await prisma.imaging.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.admissionMetrics.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@cti.com",
        login: "admin",
        password: hashPassword("Admin@123"),
        jobTitle: "Administrador",
        role: "administrator",
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        name: "Coordenador",
        email: "coordenador@cti.com",
        login: "coordenador",
        password: hashPassword("Coord@123"),
        jobTitle: "Coordenador",
        role: "coordinator",
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        name: "Rotina",
        email: "rotina@cti.com",
        login: "rotina",
        password: hashPassword("Rotina@123"),
        jobTitle: "Fisioterapeuta",
        role: "routine",
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        name: "Plantonista",
        email: "plantonista@cti.com",
        login: "plantonista",
        password: hashPassword("Plantao@123"),
        jobTitle: "Fisioterapeuta",
        role: "oncall",
        isActive: true
      }
    })
  ]);

  console.log(`${users.length} usuarios criados`);

  const beds = [];
  for (let i = 101; i <= 140; i += 1) {
    const bed = await prisma.bed.create({
      data: {
        code: `L${i}`,
        sector: "CTI 1",
        occupied: i % 5 !== 0,
        status: i % 5 === 0 ? "Vago" : i % 3 === 0 ? "Atencao" : "Estavel"
      }
    });

    beds.push(bed);
  }

  console.log(`${beds.length} leitos criados`);

  const patients = [];
  const occupiedBeds = beds.filter((bed) => bed.occupied);

  for (let i = 0; i < Math.min(8, occupiedBeds.length); i += 1) {
    const patient = await prisma.patient.create({
      data: {
        name: `Paciente ${i + 1}`,
        recordNumber: `PAC${String(i + 1).padStart(6, "0")}`,
        age: 50 + i * 10,
        diagnosis: "Sindrome respiratoria aguda",
        origin:
          i % 4 === 0
            ? "emergencia"
            : i % 4 === 1
              ? "transferencia_externa"
              : i % 4 === 2
                ? "centro_cirurgico"
                : "transferencia_interna",
        internalTransferLocation: i % 4 === 3 ? "Enfermaria" : null,
        admissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        ventilatorySupport:
          i % 3 === 0
            ? {
                type: "vmi",
                mode: "VCV",
                tidalVolume: 420,
                respiratoryRate: 18,
                peep: 8,
                fio2: 40,
                pressureSupport: 10
              }
            : {
                type: "cateter_nasal",
                flowRate: 3
              },
        mobilityLevel: i % 2 === 0 ? "Restrito ao leito" : "Sedestacao assistida",
        reasonForAdmission: "Insuficiencia respiratoria",
        clinicalHistory: {
          antecedentes: ["Hipertensao arterial", "Diabetes mellitus"],
          comorbidities: ["Obesidade", "DPOC"],
          intercurrences: [],
          clinicalAlerts: []
        },
        restrictions: {
          motor: ["Acamado"],
          respiratory: ["Sob monitorizacao continua"],
          mobilization: ["Mobilizacao passiva"],
          isolation: "Nao",
          contraindications: []
        },
        physiotherapyPlan: {
          respiratoryEvolution: "Manter suporte respiratorio",
          motorEvolution: "Mobilizacao passiva diaria",
          conducts: ["Fisioterapia respiratoria", "Monitorizacao"],
          patientResponse: "Boa tolerancia"
        }
      }
    });

    patients.push(patient);
  }

  console.log(`${patients.length} pacientes criados`);

  for (let i = 0; i < patients.length; i += 1) {
    await prisma.bed.update({
      where: { id: occupiedBeds[i].id },
      data: { patientId: patients[i].id }
    });
  }

  for (const patient of patients) {
    await prisma.admissionMetrics.create({
      data: {
        patientId: patient.id,
        daysInHospital: Math.floor(Math.random() * 30) + 1,
        daysInICU: Math.floor(Math.random() * 25) + 1,
        daysOnVM: Math.floor(Math.random() * 20),
        daysOnIOT: Math.floor(Math.random() * 15),
        daysOnTQT: Math.floor(Math.random() * 10),
        extubationTime: Math.floor(Math.random() * 48),
        lastFilterChangeDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  for (const patient of patients) {
    await prisma.lab.create({
      data: {
        patientId: patient.id,
        date: new Date(),
        hb: (10 + Math.random() * 4).toFixed(1),
        ht: (30 + Math.random() * 15).toFixed(1),
        leuco: (5 + Math.random() * 15).toFixed(0),
        bt: (0.5 + Math.random() * 2).toFixed(1),
        plq: (150 + Math.random() * 250).toFixed(0),
        ur: (20 + Math.random() * 60).toFixed(1),
        cr: (0.5 + Math.random() * 2).toFixed(1),
        pcr: (5 + Math.random() * 150).toFixed(1),
        na: (135 + Math.random() * 10).toFixed(1),
        k: (3 + Math.random() * 2).toFixed(1),
        ca: (8 + Math.random() * 2.5).toFixed(1),
        lactate: (1 + Math.random() * 4).toFixed(1)
      }
    });
  }

  for (const patient of patients.slice(0, 4)) {
    await prisma.imaging.create({
      data: {
        patientId: patient.id,
        date: new Date(),
        type: "Radiografia de torax",
        report: "Infiltrado bilateral compativel com SARA"
      }
    });
  }

  for (const patient of patients.slice(0, 4)) {
    await prisma.evolution.create({
      data: {
        patientId: patient.id,
        date: new Date(),
        type: "respiratoria",
        description: "Melhora gradual da funcao respiratoria",
        professionalName: "Fisioterapeuta Plantonista"
      }
    });
  }

  for (const patient of patients.slice(0, 3)) {
    await prisma.alert.create({
      data: {
        patientId: patient.id,
        description: "Dessaturacao noturna detectada",
        severity: "medium",
        isActive: true
      }
    });
  }

  console.log("Seed concluido com sucesso");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
