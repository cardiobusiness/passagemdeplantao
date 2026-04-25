import { Router } from "express";
import {
  createPatient,
  createPatientLab,
  dischargePatient,
  getPatientById,
  getPatientLabs,
  getPatients,
  updatePatientClinicalData
} from "../services/patientService.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const patients = await getPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({
      message: "Nao foi possivel carregar os pacientes.",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    return res.json(patient);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const patient = await createPatient(req.body);
    return res.status(201).json(patient);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/:id/labs", async (req, res) => {
  try {
    const labs = await getPatientLabs(req.params.id);
    return res.json(labs);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.post("/:id/labs", async (req, res) => {
  try {
    const lab = await createPatientLab(req.params.id, req.body);
    return res.status(201).json(lab);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.post("/:id/discharge", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dischargePatient(id, req.body);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/:id/clinical-data", async (req, res) => {
  try {
    const result = await updatePatientClinicalData(req.params.id, req.body);
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

export default router;
