import express from "express";
import { prisma } from "../middleware/prismaMiddleware.js";
import { addTrialDays, buildOrganizationPayload } from "../services/organizationService.js";
import { createPasswordHash } from "../utils/password.js";

const router = express.Router();

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function assertRequired(value, message) {
  if (!normalizeText(value)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

router.post("/", async (req, res) => {
  try {
    const { organization, masterUser } = req.body;

    assertRequired(organization?.name, "Informe o nome da organizacao.");
    assertRequired(masterUser?.name, "Informe o nome do administrador.");
    assertRequired(masterUser?.email, "Informe o e-mail do administrador.");
    assertRequired(masterUser?.login, "Informe o login do administrador.");
    assertRequired(masterUser?.password, "Informe a senha do administrador.");

    const email = normalizeEmail(masterUser.email);
    const login = normalizeEmail(masterUser.login);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: normalizeText(organization.name),
          document: normalizeText(organization.document) || null,
          email: normalizeEmail(organization.email) || null,
          phone: normalizeText(organization.phone) || null,
          plan: "trial",
          status: "trial",
          trialStartsAt: now,
          trialEndsAt: addTrialDays(now, 60),
          isActive: true
        }
      });

      const user = await tx.user.create({
        data: {
          name: normalizeText(masterUser.name),
          email,
          login,
          password: createPasswordHash(masterUser.password),
          isActive: true
        }
      });

      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: newOrg.id,
          role: "administrator",
          jobTitle: normalizeText(masterUser.profession) || "Administrador",
          isActive: true
        }
      });

      return {
        organization: buildOrganizationPayload(newOrg),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          login: user.login,
          isActive: user.isActive
        }
      };
    });

    res.status(201).json({
      success: true,
      message: "Conta criada com sucesso",
      ...result
    });
  } catch (error) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({ message: "E-mail ou login ja cadastrado." });
    }

    return res.status(error.statusCode ?? 500).json({
      message: error.message || "Erro ao criar conta"
    });
  }
});

export default router;
