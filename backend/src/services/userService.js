import { randomBytes } from "node:crypto";
import { prisma } from "../middleware/prismaMiddleware.js";
import { buildOrganizationPayload } from "./organizationService.js";
import { createPasswordHash, verifyPassword } from "../utils/password.js";

const sessions = new Map();

function sanitizeUser(user) {
  const { password, organization, ...safeUser } = user;

  return {
    ...safeUser,
    organization: buildOrganizationPayload(organization)
  };
}

function normalizeRole(role) {
  const normalizedRole = String(role ?? "").trim().toLowerCase();

  if (!["administrator", "coordinator", "routine", "oncall"].includes(normalizedRole)) {
    throw new Error("Perfil de acesso invalido.");
  }

  return normalizedRole;
}

function normalizeEmail(email) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Informe o e-mail.");
  }

  return normalizedEmail;
}

function normalizeLogin(login) {
  const normalizedLogin = String(login ?? "").trim().toLowerCase();

  if (!normalizedLogin) {
    throw new Error("Informe o login.");
  }

  return normalizedLogin;
}

function normalizeOrganizationId(organizationId) {
  const numericOrganizationId = Number(organizationId);

  if (!Number.isInteger(numericOrganizationId) || numericOrganizationId <= 0) {
    throw new Error("Organizacao da sessao invalida.");
  }

  return numericOrganizationId;
}

function notFoundUserError() {
  const notFoundError = new Error("Profissional nao encontrado.");
  notFoundError.statusCode = 404;
  return notFoundError;
}

export async function authenticateUser(identifier, password) {
  const normalizedIdentifier = String(identifier ?? "").trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { mode: "insensitive", equals: normalizedIdentifier } },
        { login: { mode: "insensitive", equals: normalizedIdentifier } }
      ]
    },
    include: {
      organization: true
    }
  });

  if (!user || !(await verifyPassword(password, user.password))) {
    throw new Error("Login ou senha invalidos.");
  }

  if (!user.isActive) {
    const inactiveError = new Error("Usuario inativo. Procure um administrador.");
    inactiveError.statusCode = 403;
    throw inactiveError;
  }

  if (!user.organization?.isActive) {
    const inactiveOrganizationError = new Error("Organizacao inativa. Procure o suporte.");
    inactiveOrganizationError.statusCode = 403;
    throw inactiveOrganizationError;
  }

  const token = `session-${randomBytes(24).toString("hex")}`;
  const safeUser = sanitizeUser(user);
  sessions.set(token, safeUser);

  return {
    token,
    user: safeUser,
    organization: safeUser.organization
  };
}

export function getUserByToken(token) {
  return sessions.get(token);
}

export function logoutUser(token) {
  sessions.delete(token);
}

export async function listUsers(organizationId) {
  const scopedOrganizationId = normalizeOrganizationId(organizationId);

  return prisma.user.findMany({
    where: {
      organizationId: scopedOrganizationId
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      login: true,
      email: true,
      role: true,
      jobTitle: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function listActiveProfessionals(organizationId) {
  const scopedOrganizationId = normalizeOrganizationId(organizationId);

  return prisma.user.findMany({
    where: {
      organizationId: scopedOrganizationId,
      isActive: true
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      login: true,
      email: true,
      role: true,
      jobTitle: true,
      isActive: true
    },
    orderBy: { name: "asc" }
  });
}

export async function createUser(payload, organizationId) {
  const scopedOrganizationId = normalizeOrganizationId(organizationId);
  const name = String(payload?.name ?? "").trim();
  const email = normalizeEmail(payload?.email);
  const login = normalizeLogin(payload?.login);
  const password = String(payload?.password ?? "");
  const jobTitle = String(payload?.jobTitle ?? payload?.role ?? "").trim();
  const role = normalizeRole(payload?.role);
  const isActive = Boolean(payload?.isActive);

  if (!name) {
    throw new Error("Informe o nome completo.");
  }

  if (!password) {
    throw new Error("Informe a senha inicial.");
  }

  if (!jobTitle) {
    throw new Error("Informe o cargo ou funcao.");
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email }
  });

  if (existingEmail) {
    throw new Error("Ja existe um profissional com este e-mail.");
  }

  const existingLogin = await prisma.user.findUnique({
    where: { login }
  });

  if (existingLogin) {
    throw new Error("Ja existe um profissional com este login.");
  }

  const user = await prisma.user.create({
    data: {
      organizationId: scopedOrganizationId,
      name,
      email,
      login,
      password: createPasswordHash(password),
      jobTitle,
      role,
      isActive
    },
    include: {
      organization: true
    }
  });

  return sanitizeUser(user);
}

export async function updateUser(userId, payload, organizationId) {
  const scopedOrganizationId = normalizeOrganizationId(organizationId);
  const numericUserId = Number(userId);

  const user = await prisma.user.findFirst({
    where: {
      id: numericUserId,
      organizationId: scopedOrganizationId
    }
  });

  if (!user) {
    throw notFoundUserError();
  }

  const name = String(payload?.name ?? user.name).trim();
  const email = normalizeEmail(payload?.email ?? user.email);
  const login = normalizeLogin(payload?.login ?? user.login);
  const jobTitle = String(payload?.jobTitle ?? user.jobTitle).trim();
  const role = normalizeRole(payload?.role ?? user.role);

  if (!name) {
    throw new Error("Informe o nome completo.");
  }

  if (!jobTitle) {
    throw new Error("Informe o cargo ou funcao.");
  }

  if (email !== user.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmail) {
      throw new Error("Ja existe um profissional com este e-mail.");
    }
  }

  if (login !== user.login) {
    const existingLogin = await prisma.user.findUnique({
      where: { login }
    });
    if (existingLogin) {
      throw new Error("Ja existe um profissional com este login.");
    }
  }

  const updated = await prisma.user.update({
    where: { id: numericUserId },
    data: {
      name,
      email,
      login,
      jobTitle,
      role,
      ...(typeof payload?.isActive === "boolean" && { isActive: payload.isActive })
    },
    include: {
      organization: true
    }
  });

  return sanitizeUser(updated);
}

export async function updateUserStatus(userId, isActive, organizationId) {
  const scopedOrganizationId = normalizeOrganizationId(organizationId);
  const numericUserId = Number(userId);

  const user = await prisma.user.findFirst({
    where: {
      id: numericUserId,
      organizationId: scopedOrganizationId
    }
  });

  if (!user) {
    throw notFoundUserError();
  }

  const updated = await prisma.user.update({
    where: { id: numericUserId },
    data: { isActive: Boolean(isActive) },
    include: {
      organization: true
    }
  });

  return sanitizeUser(updated);
}

export async function resetUserPassword(userId, password, organizationId) {
  const scopedOrganizationId = normalizeOrganizationId(organizationId);
  const numericUserId = Number(userId);

  const user = await prisma.user.findFirst({
    where: {
      id: numericUserId,
      organizationId: scopedOrganizationId
    }
  });

  if (!user) {
    throw notFoundUserError();
  }

  const nextPassword = String(password ?? "");

  if (!nextPassword) {
    throw new Error("Informe a nova senha.");
  }

  const updated = await prisma.user.update({
    where: { id: numericUserId },
    data: { password: createPasswordHash(nextPassword) },
    include: {
      organization: true
    }
  });

  return sanitizeUser(updated);
}
