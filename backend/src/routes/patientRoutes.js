import { Router } from "express";
import {
  createPatient,
  createPatientLab,
  deletePatientLab,
  dischargePatient,
  getPatientById,
  getPatientLabs,
  getPatients,
  updatePatientLab
} from "../services/patientService.js";

const router = Router();

router.get("/", (_req, res) => {
  try {
    res.json(getPatients());
  } catch (error) {
    res.status(500).json({
      message: "Nao foi possivel carregar os pacientes.",
      error: error.message
    });
  }
});

router.get("/:id", (req, res) => {
  try {
    const patient = getPatientById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Paciente nao encontrado." });
    }

    return res.json(patient);
  } catch (error) {
    return res.status(500).json({ message: "Nao foi possivel carregar o paciente.", error: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    const patient = createPatient(req.body);
    return res.status(201).json(patient);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/:id/labs", (req, res) => {
  try {
    const labs = getPatientLabs(req.params.id);
    return res.json(labs);
  } catch (error) {
    const statusCode = error.message === "Paciente nao encontrado." ? 404 : 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.post("/:id/labs", (req, res) => {
  try {
    const lab = createPatientLab(req.params.id, req.body);
    return res.status(201).json(lab);
  } catch (error) {
    const statusCode = error.message === "Paciente nao encontrado." ? 404 : 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.put("/:id/labs/:labId", (req, res) => {
  try {
    const lab = updatePatientLab(req.params.id, req.params.labId, req.body);
    return res.json(lab);
  } catch (error) {
    const statusCode =
      error.message === "Paciente nao encontrado." || error.message === "Registro laboratorial nao encontrado."
        ? 404
        : 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.delete("/:id/labs/:labId", (req, res) => {
  try {
    const lab = deletePatientLab(req.params.id, req.params.labId);
    return res.json(lab);
  } catch (error) {
    const statusCode =
      error.message === "Paciente nao encontrado." || error.message === "Registro laboratorial nao encontrado."
        ? 404
        : 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

router.post("/:id/discharge", (req, res) => {
  try {
    const patient = dischargePatient(req.params.id, req.body);
    return res.json(patient);
  } catch (error) {
    const statusCode = error.message === "Paciente nao encontrado." ? 404 : 400;
    return res.status(statusCode).json({ message: error.message });
  }
});

export default router;
