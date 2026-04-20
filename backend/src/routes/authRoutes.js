import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authenticateUser, listActiveProfessionals, logoutUser } from "../services/userService.js";

const router = Router();

router.post("/login", (req, res) => {
  const { email, login, identifier, password } = req.body;
  const authIdentifier = identifier || login || email;

  if (!authIdentifier || !password) {
    return res.status(400).json({ message: "Informe login e senha." });
  }

  try {
    return res.json(authenticateUser(authIdentifier, password));
  } catch (error) {
    return res.status(error.statusCode ?? 401).json({ message: error.message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  return res.json(req.user);
});

router.get("/professionals", requireAuth, (_req, res) => {
  return res.json(listActiveProfessionals());
});

router.post("/logout", requireAuth, (req, res) => {
  logoutUser(req.authToken);
  return res.status(204).send();
});

export default router;
