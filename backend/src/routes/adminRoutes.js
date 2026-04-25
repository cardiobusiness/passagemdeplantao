import { Router } from "express";
import { requireAdminManagementAccess, requireAuth } from "../middleware/authMiddleware.js";
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus
} from "../services/userService.js";

const router = Router();

router.use(requireAuth, requireAdminManagementAccess);

router.get("/users", async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/users", async (req, res) => {
  try {
    const user = await createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const user = await updateUserStatus(req.params.id, req.body?.isActive);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/users/:id/reset-password", async (req, res) => {
  try {
    const user = await resetUserPassword(req.params.id, req.body?.password);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

export default router;
