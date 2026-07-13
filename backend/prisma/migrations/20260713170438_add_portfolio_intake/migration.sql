-- CreateEnum
CREATE TYPE "IntakeLinkStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "IntakeSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PortfolioIntakeLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "label" TEXT,
    "status" "IntakeLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioIntakeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSubmission" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "submitterName" TEXT NOT NULL,
    "submitterPhone" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "listingType" "ListingType" NOT NULL DEFAULT 'SALE',
    "title" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "neighborhood" TEXT,
    "areaSqm" INTEGER NOT NULL,
    "roomCount" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kvkkAcceptedAt" TIMESTAMP(3) NOT NULL,
    "status" "IntakeSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "portfolioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioIntakeLink_token_key" ON "PortfolioIntakeLink"("token");

-- CreateIndex
CREATE INDEX "PortfolioIntakeLink_officeId_status_idx" ON "PortfolioIntakeLink"("officeId", "status");

-- CreateIndex
CREATE INDEX "PortfolioIntakeLink_token_idx" ON "PortfolioIntakeLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSubmission_portfolioId_key" ON "PortfolioSubmission"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioSubmission_officeId_status_createdAt_idx" ON "PortfolioSubmission"("officeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PortfolioSubmission_linkId_idx" ON "PortfolioSubmission"("linkId");

-- AddForeignKey
ALTER TABLE "PortfolioIntakeLink" ADD CONSTRAINT "PortfolioIntakeLink_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioIntakeLink" ADD CONSTRAINT "PortfolioIntakeLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSubmission" ADD CONSTRAINT "PortfolioSubmission_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "PortfolioIntakeLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSubmission" ADD CONSTRAINT "PortfolioSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
