import { getUserByToken } from "../services/userService.js";

function getBearerToken(req) {
  const authorization = req.headers.authorization ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Acesso nao autorizado." });
  }

  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ message: "Sessao invalida ou expirada." });
  }

  req.user = user;
  req.authToken = token;
  next();
}

export function requireAdministrator(req, res, next) {
  if (req.user?.role !== "administrator") {
    return res.status(403).json({ message: "Somente administradores podem acessar esta area." });
  }

  next();
}
