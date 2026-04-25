import { Router } from "express";
import { getBeds } from "../services/bedService.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const beds = await getBeds();
    res.json(beds);
  } catch (error) {
    res.status(500).json({
      message: "Nao foi possivel carregar os leitos.",
      error: error.message,
    });
  }
});

export default router;
