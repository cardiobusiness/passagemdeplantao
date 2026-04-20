import { createHash, randomBytes } from "node:crypto";
import { teamUsers } from "../data/mockData.js";

const sessions = new Map();

function hashPasswordWithSalt(password, salt) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function createPasswordHash(password) {
  const normalizedPassword = String(password ?? "").trim();

  if (normalizedPassword.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const salt = randomBytes(12).toString("hex");
  const hash = hashPasswordWithSalt(normalizedPassword, salt);

  return `${salt}$${hash}`;
}

function verifyPassword(password, storedPasswordHash) {
  const [salt, storedHash] = String(storedPasswordHash ?? "").split("$");

  if (!salt || !storedHash) {
    return false;
  }

  return hashPasswordWithSalt(password, salt) === storedHash;
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
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

function findUserByIdentifier(identifier) {
  const normalizedIdentifier = String(identifier ?? "").trim().toLowerCase();

  return teamUsers.find(
    (user) => user.email.toLowerCase() === normalizedIdentifier || user.login.toLowerCase() === normalizedIdentifier
  );
}

function ensureUniqueUserFields(email, login, excludedUserId = null) {
  const emailAlreadyExists = teamUsers.some(
    (user) => user.email.toLowerCase() === email && user.id !== excludedUserId
  );

  if (emailAlreadyExists) {
    throw new Error("Ja existe um profissional com este e-mail.");
  }

  const loginAlreadyExists = teamUsers.some(
    (user) => user.login.toLowerCase() === login && user.id !== excludedUserId
  );

  if (loginAlreadyExists) {
    throw new Error("Ja existe um profissional com este login.");
  }
}

export function authenticateUser(identifier, password) {
  const user = findUserByIdentifier(identifier);

  if (!user || !verifyPassword(String(password ?? ""), user.passwordHash)) {
    throw new Error("Login ou senha invalidos.");
  }

  if (!user.isActive) {
    const inactiveError = new Error("Usuario inativo. Procure um administrador.");
    inactiveError.statusCode = 403;
    throw inactiveError;
  }

  const token = `mock-session-${randomBytes(24).toString("hex")}`;
  sessions.set(token, user.id);

  return {
    token,
    user: sanitizeUser(user)
  };
}

export function getUserByToken(token) {
  const userId = sessions.get(token);

  if (!userId) {
    return null;
  }

  const user = teamUsers.find((item) => item.id === userId);

  return user ? sanitizeUser(user) : null;
}

export function logoutUser(token) {
  sessions.delete(token);
}

export function listUsers() {
  return teamUsers.map(sanitizeUser);
}

export function listActiveProfessionals() {
  return teamUsers.filter((user) => user.isActive).map(sanitizeUser);
}

export function createUser(payload) {
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

  ensureUniqueUserFields(email, login);

  const user = {
    id: teamUsers.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1,
    name,
    email,
    login,
    passwordHash: createPasswordHash(password),
    jobTitle,
    role,
    isActive
  };

  teamUsers.push(user);

  return sanitizeUser(user);
}

export function updateUser(userId, payload) {
  const user = teamUsers.find((item) => item.id === Number(userId));

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

  ensureUniqueUserFields(email, login, user.id);

  user.name = name;
  user.email = email;
  user.login = login;
  user.jobTitle = jobTitle;
  user.role = role;

  if (typeof payload?.isActive === "boolean") {
    user.isActive = payload.isActive;
  }

  return sanitizeUser(user);
}

export function updateUserStatus(userId, isActive) {
  const user = teamUsers.find((item) => item.id === Number(userId));

  if (!user) {
    const notFoundError = new Error("Profissional nao encontrado.");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  user.isActive = Boolean(isActive);

  return sanitizeUser(user);
}

export function resetUserPassword(userId, password) {
  const user = teamUsers.find((item) => item.id === Number(userId));

  if (!user) {
    const notFoundError = new Error("Profissional nao encontrado.");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  user.passwordHash = createPasswordHash(password);

  return sanitizeUser(user);
}
