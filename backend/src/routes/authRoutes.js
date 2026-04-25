import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authenticateUser, listActiveProfessionals, logoutUser } from "../services/userService.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, login, identifier, password } = req.body;
  const authIdentifier = identifier || login || email;

  if (!authIdentifier || !password) {
    return res.status(400).json({ message: "Informe login e senha." });
  }

  try {
    const result = await authenticateUser(authIdentifier, password);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode ?? 401).json({ message: error.message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token invalido." });
  }

  return res.json(req.user);
});

router.get("/professionals", requireAuth, async (_req, res) => {
  try {
    const professionals = await listActiveProfessionals();
    return res.json(professionals);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  logoutUser(req.authToken);
  return res.json({ message: "Logout realizado com sucesso." });
});

export default router;
