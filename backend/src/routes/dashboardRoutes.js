import { Router } from "express";
import { beds, monthlyDashboard, patients } from "../data/mockData.js";
import { getPatients } from "../services/patientService.js";

const router = Router();

router.get("/monthly", (_req, res) => {
  try {
    const activePatients = getPatients().filter((patient) => patient.bedId !== null);
    const occupiedBeds = beds.filter((bed) => bed.occupied).length;
    const activeAlerts = activePatients.reduce((total, patient) => total + patient.respiratoryAlerts.length, 0);
    const respiratoryEvolutions = activePatients.reduce(
      (total, patient) =>
        total + patient.evolutions.filter((evolution) => evolution.type === "Respiratoria").length,
      0
    );
    const motorEvolutions = activePatients.reduce(
      (total, patient) => total + patient.evolutions.filter((evolution) => evolution.type === "Motora").length,
      0
    );
    const examsRegistered = patients.reduce(
      (total, patient) => total + patient.labs.length + patient.bloodGas.length + patient.imaging.length,
      0
    );
    const currentDate = new Date();
    const averageLengthOfStay = activePatients.length
      ? Number(
          (
            activePatients.reduce((total, patient) => {
              const admissionDate = new Date(`${patient.ctiAdmissionDate}T00:00:00`);
              const diffInDays = Math.max(
                1,
                Math.ceil((currentDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24))
              );

              return total + diffInDays;
            }, 0) / activePatients.length
          ).toFixed(1)
        )
      : 0;

    res.json({
      month: monthlyDashboard.month,
      occupancyRate: beds.length ? Math.round((occupiedBeds / beds.length) * 100) : 0,
      activeAlerts,
      respiratoryEvolutions,
      motorEvolutions,
      averageLengthOfStay,
      examsRegistered
    });
  } catch (error) {
    res.status(500).json({ message: "Nao foi possivel carregar o dashboard.", error: error.message });
  }
});

export default router;
