import { Router } from "express";
import {
  requireAdminManagementAccess,
  requireAuth,
  requireOrganizationWriteAccess
} from "../middleware/authMiddleware.js";
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus
} from "../services/userService.js";

const router = Router();

router.use(requireAuth, requireAdminManagementAccess);

router.get("/users", async (req, res) => {
  try {
    const users = await listUsers(req.user.organizationId);
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/users", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const user = await createUser(req.body, req.user.organizationId);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.put("/users/:id", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body, req.user.organizationId);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/users/:id/status", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const user = await updateUserStatus(req.params.id, req.body?.isActive, req.user.organizationId);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/users/:id/reset-password", requireOrganizationWriteAccess, async (req, res) => {
  try {
    const user = await resetUserPassword(req.params.id, req.body?.password, req.user.organizationId);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

export default router;
