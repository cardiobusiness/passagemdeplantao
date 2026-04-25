import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createHandover, getHandovers, getHandoverById } from "../services/handoverService.js";

const router = Router();

router.use(requireAuth);

router.get("/", (_req, res) => {
  return res.json(getHandovers());
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const handover = getHandoverById(id);

  if (!handover) {
    return res.status(404).json({ message: "Passagem de plantão não encontrada." });
  }

  return res.json(handover);
});

router.post("/", (req, res) => {
  const { professionalId, bedIds } = req.body;

  if (!professionalId || !Array.isArray(bedIds) || bedIds.length === 0) {
    return res.status(400).json({ message: "Profissional e leitos são obrigatórios." });
  }

  try {
    const handover = createHandover(professionalId, bedIds);
    return res.status(201).json(handover);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;