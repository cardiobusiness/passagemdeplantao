import { randomBytes } from "node:crypto";
import { prisma } from "../middleware/prismaMiddleware.js";
import { createPasswordHash, verifyPassword } from "../utils/password.js";

const sessions = new Map();

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
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

export async function authenticateUser(identifier, password) {
  const normalizedIdentifier = String(identifier ?? "").trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { mode: 'insensitive', equals: normalizedIdentifier } },
        { login: { mode: 'insensitive', equals: normalizedIdentifier } }
      ]
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

  const token = `session-${randomBytes(24).toString("hex")}`;
  sessions.set(token, sanitizeUser(user));

  return {
    token,
    user: sanitizeUser(user)
  };
}

export function getUserByToken(token) {
  const user = sessions.get(token);
  return user;
}

export function logoutUser(token) {
  sessions.delete(token);
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      login: true,
      email: true,
      role: true,
      jobTitle: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  return users;
}

export async function listActiveProfessionals() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      login: true,
      email: true,
      role: true,
      jobTitle: true,
      isActive: true
    },
    orderBy: { name: 'asc' }
  });
  return users;
}

export async function createUser(payload) {
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

  if (!jobTitle) {
    throw new Error("Informe o cargo ou funcao.");
  }

  // Check for duplicates
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
      name,
      email,
      login,
      password: createPasswordHash(password),
      jobTitle,
      role,
      isActive
    }
  });

  return sanitizeUser(user);
}

export async function updateUser(userId, payload) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });

  if (!user) {
    const notFoundError = new Error("Profissional nao encontrado.");
    notFoundError.statusCode = 404;
    throw notFoundError;
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

  // Check for duplicates
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
    where: { id: Number(userId) },
    data: {
      name,
      email,
      login,
      jobTitle,
      role,
      ...(typeof payload?.isActive === "boolean" && { isActive: payload.isActive })
    }
  });

  return sanitizeUser(updated);
}

export async function updateUserStatus(userId, isActive) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });

  if (!user) {
    const notFoundError = new Error("Profissional nao encontrado.");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { isActive: Boolean(isActive) }
  });

  return sanitizeUser(updated);
}

export async function resetUserPassword(userId, password) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });

  if (!user) {
    const notFoundError = new Error("Profissional nao encontrado.");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { password: createPasswordHash(password) }
  });

  return sanitizeUser(updated);
}
