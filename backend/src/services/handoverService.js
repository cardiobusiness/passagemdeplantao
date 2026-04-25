import { prisma } from "../middleware/prismaMiddleware.js";

export async function createHandover(organizationId, professionalId, bedIds) {
  const professional = await prisma.user.findFirst({
    where: {
      id: Number(professionalId),
      organizationId,
      isActive: true
    }
  });

  if (!professional) {
    const error = new Error("Profissional nao encontrado nesta organizacao.");
    error.statusCode = 404;
    throw error;
  }

  const normalizedBedIds = [...new Set(bedIds.map((bedId) => Number(bedId)).filter(Number.isInteger))];

  if (normalizedBedIds.length === 0) {
    throw new Error("Informe pelo menos um leito valido.");
  }

  const beds = await prisma.bed.findMany({
    where: {
      organizationId,
      id: { in: normalizedBedIds }
    },
    select: { id: true }
  });

  if (beds.length !== normalizedBedIds.length) {
    const error = new Error("Um ou mais leitos nao pertencem a organizacao logada.");
    error.statusCode = 403;
    throw error;
  }

  return prisma.handover.create({
    data: {
      organizationId,
      professionalId: Number(professionalId),
      bedIds: normalizedBedIds
    }
  });
}

export function getHandovers(organizationId) {
  return prisma.handover.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" }
  });
}

export function getHandoverById(id, organizationId) {
  return prisma.handover.findFirst({
    where: {
      id: Number(id),
      organizationId
    }
  });
}
