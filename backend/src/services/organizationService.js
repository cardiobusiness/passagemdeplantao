import { prisma } from "../middleware/prismaMiddleware.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function addTrialDays(date = new Date(), days = 60) {
  const trialEndsAt = new Date(date);
  trialEndsAt.setDate(trialEndsAt.getDate() + days);
  return trialEndsAt;
}

export function getTrialDaysRemaining(organization) {
  if (!organization?.trialEndsAt) {
    return 0;
  }

  const endsAt = new Date(organization.trialEndsAt);

  if (Number.isNaN(endsAt.getTime())) {
    return 0;
  }

  return Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY_IN_MS));
}

export function isOrganizationAllowed(organization) {
  if (!organization?.isActive) {
    return false;
  }

  if (organization.status === "active") {
    return true;
  }

  if (organization.status === "trial") {
    const trialEndsAt = new Date(organization.trialEndsAt);
    return !Number.isNaN(trialEndsAt.getTime()) && trialEndsAt.getTime() >= Date.now();
  }

  return false;
}

export function buildOrganizationPayload(organization) {
  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    document: organization.document,
    email: organization.email,
    phone: organization.phone,
    plan: organization.plan,
    status: organization.status,
    trialStartsAt: organization.trialStartsAt,
    trialEndsAt: organization.trialEndsAt,
    trialDaysRemaining: getTrialDaysRemaining(organization),
    isActive: organization.isActive,
    isAllowed: isOrganizationAllowed(organization)
  };
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

export async function getOrganizationById(organizationId) {
  const organization = await prisma.organization.findUnique({
    where: { id: Number(organizationId) }
  });

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return buildOrganizationPayload(organization);
}

export async function updateOrganization(organizationId, payload) {
  const name = normalizeText(payload?.name);

  if (!name) {
    throw new Error("Informe o nome da organizacao.");
  }

  const organization = await prisma.organization.update({
    where: { id: Number(organizationId) },
    data: {
      name,
      document: normalizeText(payload?.document) || null,
      email: normalizeText(payload?.email) || null,
      phone: normalizeText(payload?.phone) || null
    }
  });

  return buildOrganizationPayload(organization);
}
