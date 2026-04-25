import { Router } from "express";
import { getMonthlyDashboard } from "../services/dashboardService.js";

const router = Router();

router.get("/monthly", async (_req, res) => {
  try {
    const dashboard = await getMonthlyDashboard();
    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({
      message: "Nao foi possivel carregar o dashboard.",
      error: error.message
    });
  }
});

export default router;
