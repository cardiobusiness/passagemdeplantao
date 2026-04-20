import { Router } from "express";
import { requireAdministrator, requireAuth } from "../middleware/authMiddleware.js";
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus
} from "../services/userService.js";

const router = Router();

router.use(requireAuth, requireAdministrator);

router.get("/users", (_req, res) => {
  return res.json(listUsers());
});

router.post("/users", (req, res) => {
  try {
    const user = createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.put("/users/:id", (req, res) => {
  try {
    const user = updateUser(req.params.id, req.body);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/users/:id/status", (req, res) => {
  try {
    const user = updateUserStatus(req.params.id, req.body?.isActive);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

router.patch("/users/:id/reset-password", (req, res) => {
  try {
    const user = resetUserPassword(req.params.id, req.body?.password);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode ?? 400).json({ message: error.message });
  }
});

export default router;
