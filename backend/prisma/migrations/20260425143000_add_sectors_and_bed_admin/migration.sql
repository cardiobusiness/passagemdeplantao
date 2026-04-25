-- CreateTable
CREATE TABLE "sectors" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- Add admin fields to beds while preserving the existing sector text field.
ALTER TABLE "beds" ADD COLUMN "sectorId" INTEGER;
ALTER TABLE "beds" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Backfill sectors from existing beds.
INSERT INTO "sectors" ("organizationId", "name", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT
    "organizationId",
    COALESCE(NULLIF(TRIM("sector"), ''), 'CTI 1'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "beds"
ON CONFLICT DO NOTHING;

-- Ensure organizations without beds still get an initial sector.
INSERT INTO "sectors" ("organizationId", "name", "isActive", "createdAt", "updatedAt")
SELECT
    "id",
    'CTI 1',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "organizations"
WHERE NOT EXISTS (
    SELECT 1 FROM "sectors" WHERE "sectors"."organizationId" = "organizations"."id"
);

UPDATE "beds"
SET "sectorId" = "sectors"."id"
FROM "sectors"
WHERE
    "beds"."organizationId" = "sectors"."organizationId"
    AND COALESCE(NULLIF(TRIM("beds"."sector"), ''), 'CTI 1') = "sectors"."name";

-- CreateIndex
CREATE UNIQUE INDEX "sectors_organizationId_name_key" ON "sectors"("organizationId", "name");
CREATE INDEX "sectors_organizationId_idx" ON "sectors"("organizationId");
CREATE INDEX "beds_sectorId_idx" ON "beds"("sectorId");

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beds" ADD CONSTRAINT "beds_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
