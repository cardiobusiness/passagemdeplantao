import { prisma } from "../middleware/prismaMiddleware.js";
import { mapBedRecord } from "../utils/patientMapper.js";

export async function getBeds() {
  const beds = await prisma.bed.findMany({
    include: {
      patient: {
        include: {
          beds: {
            where: { occupied: true },
            take: 1,
            orderBy: { id: "asc" }
          },
          admissionMetrics: true,
          labs: { orderBy: { date: "desc" } },
          imaging: { orderBy: { date: "desc" } },
          evolutions: { orderBy: { date: "desc" } },
          alerts: { where: { isActive: true } }
        }
      }
    },
    orderBy: { code: "asc" }
  });

  return beds.map(mapBedRecord);
}

export async function getBedById(bedId) {
  const bed = await prisma.bed.findUnique({
    where: { id: Number(bedId) },
    include: {
      patient: {
        include: {
          beds: {
            where: { occupied: true },
            take: 1,
            orderBy: { id: "asc" }
          },
          admissionMetrics: true,
          labs: { orderBy: { date: "desc" } },
          imaging: { orderBy: { date: "desc" } },
          evolutions: { orderBy: { date: "desc" } },
          alerts: { where: { isActive: true } }
        }
      }
    }
  });

  if (!bed) {
    const error = new Error("Leito nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return mapBedRecord(bed);
}

export async function createBed(payload) {
  const code = String(payload?.code ?? "").trim().toUpperCase();
  const sector = String(payload?.sector ?? "CTI 1").trim();

  if (!code) {
    throw new Error("Codigo do leito nao informado.");
  }

  const bed = await prisma.bed.create({
    data: {
      code,
      sector,
      occupied: false,
      status: "Vago"
    }
  });

  return mapBedRecord({ ...bed, patient: null });
}

export async function updateBed(bedId, payload) {
  const bed = await prisma.bed.findUnique({
    where: { id: Number(bedId) }
  });

  if (!bed) {
    const error = new Error("Leito nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.bed.update({
    where: { id: Number(bedId) },
    data: {
      ...(payload?.occupied !== undefined && { occupied: Boolean(payload.occupied) }),
      ...(payload?.status && { status: String(payload.status) }),
      ...(payload?.patientId !== undefined && { patientId: payload.patientId ? Number(payload.patientId) : null })
    },
    include: {
      patient: {
        include: {
          beds: {
            where: { occupied: true },
            take: 1,
            orderBy: { id: "asc" }
          },
          admissionMetrics: true,
          labs: { orderBy: { date: "desc" } },
          imaging: { orderBy: { date: "desc" } },
          evolutions: { orderBy: { date: "desc" } },
          alerts: { where: { isActive: true } }
        }
      }
    }
  });

  return mapBedRecord(updated);
}
