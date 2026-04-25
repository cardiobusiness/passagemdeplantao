import { Router } from "express";
import { requireAdministrator, requireAuth, requireOrganizationWriteAccess } from "../middleware/authMiddleware.js";
import { getOrganizationById, updateOrganization } from "../services/organizationService.js";

const router = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  try {
    const organization = await getOrganizationById(req.user.organizationId);
    return res.json(organization);
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({ message: error.message });
  }
});

router.patch("/me", requireAdministrator, requireOrganizationWriteAccess, async (req, res) => {
  try {
    const organization = await updateOrganization(req.user.organizationId, req.body);
    return res.json(organization);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

export default router;
