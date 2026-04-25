-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "status" TEXT NOT NULL DEFAULT 'trial',
    "trialStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Seed a default organization so existing data can be migrated safely.
INSERT INTO "organizations" (
    "name",
    "plan",
    "status",
    "trialStartsAt",
    "trialEndsAt",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    'Organização Padrão',
    'trial',
    'trial',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '60 days',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "organizations");

-- Add organization ownership columns while nullable, backfill, then enforce.
ALTER TABLE "users" ADD COLUMN "organizationId" INTEGER;
ALTER TABLE "beds" ADD COLUMN "organizationId" INTEGER;
ALTER TABLE "patients" ADD COLUMN "organizationId" INTEGER;
ALTER TABLE "handovers" ADD COLUMN "organizationId" INTEGER;

DO $$
DECLARE
    default_organization_id INTEGER;
BEGIN
    SELECT "id" INTO default_organization_id
    FROM "organizations"
    ORDER BY "id"
    LIMIT 1;

    UPDATE "users" SET "organizationId" = default_organization_id WHERE "organizationId" IS NULL;
    UPDATE "beds" SET "organizationId" = default_organization_id WHERE "organizationId" IS NULL;
    UPDATE "patients" SET "organizationId" = default_organization_id WHERE "organizationId" IS NULL;
    UPDATE "handovers" SET "organizationId" = default_organization_id WHERE "organizationId" IS NULL;
END $$;

ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "beds" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "handovers" ALTER COLUMN "organizationId" SET NOT NULL;

-- Bed codes and patient records are unique inside an organization, not globally.
DROP INDEX IF EXISTS "beds_code_key";
DROP INDEX IF EXISTS "patients_recordNumber_key";

CREATE UNIQUE INDEX "beds_organizationId_code_key" ON "beds"("organizationId", "code");
CREATE INDEX "beds_organizationId_idx" ON "beds"("organizationId");
CREATE INDEX "beds_patientId_idx" ON "beds"("patientId");
CREATE UNIQUE INDEX "patients_organizationId_recordNumber_key" ON "patients"("organizationId", "recordNumber");
CREATE INDEX "patients_organizationId_idx" ON "patients"("organizationId");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX "handovers_organizationId_idx" ON "handovers"("organizationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beds" ADD CONSTRAINT "beds_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patients" ADD CONSTRAINT "patients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
