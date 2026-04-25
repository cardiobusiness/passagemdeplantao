import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import handoverRoutes from "./routes/handoverRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import sectorRoutes from "./routes/sectorRoutes.js";
import { checkDatabaseConnection } from "./config/database.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", async (_req, res) => {
  const dbStatus = await checkDatabaseConnection();

  res.json({
    status: "ok",
    service: "cti-fisio-backend",
    database: dbStatus
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/sectors", sectorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/handovers", handoverRoutes);

app.use((req, res) => {
  return res.status(404).json({
    message: "Rota nao encontrada."
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  return res.status(error.statusCode ?? 500).json({
    message: error.message || "Erro interno do servidor."
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
