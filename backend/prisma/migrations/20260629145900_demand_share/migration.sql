-- CreateEnum
CREATE TYPE "DemandShareMode" AS ENUM ('ALL_MATCHES', 'PINNED');

-- CreateEnum
CREATE TYPE "DemandShareStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "DemandShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "mode" "DemandShareMode" NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "DemandShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemandShare_token_key" ON "DemandShare"("token");

-- CreateIndex
CREATE INDEX "DemandShare_demandId_idx" ON "DemandShare"("demandId");

-- CreateIndex
CREATE INDEX "DemandShare_token_idx" ON "DemandShare"("token");

-- AddForeignKey
ALTER TABLE "DemandShare" ADD CONSTRAINT "DemandShare_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandShare" ADD CONSTRAINT "DemandShare_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandShare" ADD CONSTRAINT "DemandShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
