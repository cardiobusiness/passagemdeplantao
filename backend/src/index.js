import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import { checkDatabaseConnection } from "./config/database.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
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
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
