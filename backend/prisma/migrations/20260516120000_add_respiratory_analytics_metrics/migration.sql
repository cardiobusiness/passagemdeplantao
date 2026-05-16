ALTER TABLE "admission_metrics"
ADD COLUMN "extubationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reintubationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nonInvasiveVentilationDays" INTEGER NOT NULL DEFAULT 0;
