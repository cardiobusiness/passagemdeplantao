import { Router } from "express";
import { beds } from "../data/mockData.js";
import { getPatients } from "../services/patientService.js";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const patients = getPatients();
    const enrichedBeds = beds.map((bed) => ({
      ...bed,
      alertCount: bed.patientId
        ? (patients.find((p) => p.id === bed.patientId)?.respiratoryAlerts.length ?? bed.alertCount)
        : 0,
      patient: bed.patientId
        ? patients.find((p) => p.id === bed.patientId) ?? null
        : null,
    }));

    res.json(enrichedBeds);
  } catch (error) {
    res.status(500).json({
      message: "Nao foi possivel carregar os leitos.",
      error: error.message,
    });
  }
});

export default router;
