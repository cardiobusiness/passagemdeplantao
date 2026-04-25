import { Router } from "express";
import {
  requireAdminManagementAccess,
  requireAuth,
  requireOrganizationWriteAccess
} from "../middleware/authMiddleware.js";
import { createSector, listSectors, updateSector } from "../services/sectorService.js";

const router = Router();

router.use(requireAuth, requireAdminManagementAccess);

router.get("/", async (req, res) => {
  try {
    const sectors = await listSectors(req.user.organizationId);
    return res.json(sectors);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const sector = await createSector(req.body, req.user.organizationId);
    return res.status(201).json(sector);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const sector = await updateSector(req.body?.id, req.body, req.user.organizationId);
    return res.json(sector);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/:id", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const sector = await updateSector(req.params.id, req.body, req.user.organizationId);
    return res.json(sector);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

export default router;
