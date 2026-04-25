import { prisma } from "../middleware/prismaMiddleware.js";

const originLabels = {
  emergencia: "Emergencia",
  transferencia_externa: "Transferencia externa",
  centro_cirurgico: "Centro Cirurgico",
  transferencia_interna: "Transferencia interna",
  nao_informado: "Nao informado"
};

export async function getMonthlyDashboard(organizationId) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [totalBeds, occupiedBeds, totalPatients, admissionsThisMonth, activeAlerts, patientOrigins] = await Promise.all([
    prisma.bed.count({
      where: {
        organizationId,
        isActive: true,
        OR: [{ sectorId: null }, { sectorRef: { isActive: true } }]
      }
    }),
    prisma.bed.count({
      where: {
        organizationId,
        occupied: true,
        isActive: true,
        OR: [{ sectorId: null }, { sectorRef: { isActive: true } }]
      }
    }),
    prisma.patient.count({ where: { organizationId } }),
    prisma.patient.count({
      where: {
        organizationId,
        admissionDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      }
    }),
    prisma.alert.count({
      where: {
        isActive: true,
        patient: { organizationId }
      }
    }),
    prisma.patient.findMany({
      where: { organizationId },
      select: {
        age: true,
        origin: true
      }
    })
  ]);

  const respiratoryEvolutions = await prisma.evolution.count({
    where: {
      patient: { organizationId },
      type: "respiratoria",
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      }
    }
  });

  const motorEvolutions = await prisma.evolution.count({
    where: {
      patient: { organizationId },
      type: "motora",
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      }
    }
  });

  const labs = await prisma.lab.count({
    where: {
      patient: { organizationId },
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      }
    }
  });

  const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  const avgLengthOfStay =
    totalPatients > 0
      ? Math.round(
          (await prisma.admissionMetrics.aggregate({
            where: {
              patient: { organizationId }
            },
            _avg: { daysInICU: true }
          }))._avg.daysInICU || 0
        )
      : 0;

  const originBuckets = patientOrigins.reduce((accumulator, patient) => {
    const origin = patient.origin ?? "nao_informado";
    const current = accumulator.get(origin) ?? { total: 0, ageSum: 0 };
    current.total += 1;
    current.ageSum += patient.age ?? 0;
    accumulator.set(origin, current);
    return accumulator;
  }, new Map());

  const orderedOrigins = [
    "emergencia",
    "transferencia_externa",
    "centro_cirurgico",
    "transferencia_interna",
    "nao_informado"
  ];

  const originStats = orderedOrigins.map((origin) => {
    const bucket = originBuckets.get(origin) ?? { total: 0, ageSum: 0 };
    return {
      origin,
      label: originLabels[origin],
      total: bucket.total,
      percentage: totalPatients > 0 ? Math.round((bucket.total / totalPatients) * 100) : 0
    };
  });

  const averageAdmissionAge =
    totalPatients > 0
      ? Math.round(patientOrigins.reduce((sum, patient) => sum + (patient.age ?? 0), 0) / totalPatients)
      : 0;

  const averageAgeByOrigin = orderedOrigins.map((origin) => {
    const bucket = originBuckets.get(origin) ?? { total: 0, ageSum: 0 };
    return {
      origin,
      label: originLabels[origin],
      averageAge: bucket.total > 0 ? Math.round(bucket.ageSum / bucket.total) : 0
    };
  });

  return {
    month: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    occupancyRate: Math.round(occupancyRate),
    activeAlerts,
    respiratoryEvolutions,
    motorEvolutions,
    averageLengthOfStay: avgLengthOfStay,
    averageAdmissionAge,
    originStats,
    averageAgeByOrigin,
    examsRegistered: labs,
    metrics: {
      totalBeds,
      occupiedBeds,
      totalPatients,
      admissionsThisMonth
    }
  };
}
