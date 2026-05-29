-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "officeId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Office_ownerId_key" ON "Office"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_officeId_status_idx" ON "Invite"("officeId", "status");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- AlterTable: add officeId columns as nullable first (for backfill)
ALTER TABLE "User" ADD COLUMN "officeId" TEXT;
ALTER TABLE "Portfolio" ADD COLUMN "officeId" TEXT;
ALTER TABLE "Demand" ADD COLUMN "officeId" TEXT;

-- Backfill: create a default "Demo Ofis" owned by the oldest ADMIN (fallback oldest user)
-- and assign all existing users, portfolios and demands to it.
DO $$
DECLARE
    owner_id TEXT;
    office_id TEXT := 'demoofficeseed00000000000';
BEGIN
    SELECT id INTO owner_id
    FROM "User"
    ORDER BY (role = 'ADMIN') DESC, "createdAt" ASC
    LIMIT 1;

    IF owner_id IS NOT NULL THEN
        INSERT INTO "Office" (id, name, "ownerId", "createdAt", "updatedAt")
        VALUES (office_id, 'Demo Ofis', owner_id, now(), now());

        UPDATE "User" SET "officeId" = office_id;
        UPDATE "Portfolio" SET "officeId" = office_id;
        UPDATE "Demand" SET "officeId" = office_id;
    END IF;
END $$;

-- Now enforce NOT NULL on portfolio/demand officeId (rows are backfilled)
ALTER TABLE "Portfolio" ALTER COLUMN "officeId" SET NOT NULL;
ALTER TABLE "Demand" ALTER COLUMN "officeId" SET NOT NULL;

-- Replace the old portfolio composite index with an office-scoped one
DROP INDEX IF EXISTS "Portfolio_type_city_district_visibility_idx";

-- CreateIndex
CREATE INDEX "Portfolio_officeId_type_city_district_visibility_idx" ON "Portfolio"("officeId", "type", "city", "district", "visibility");
CREATE INDEX "Portfolio_officeId_deletedAt_idx" ON "Portfolio"("officeId", "deletedAt");
CREATE INDEX "Demand_officeId_status_idx" ON "Demand"("officeId", "status");
CREATE INDEX "Demand_officeId_deletedAt_idx" ON "Demand"("officeId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
