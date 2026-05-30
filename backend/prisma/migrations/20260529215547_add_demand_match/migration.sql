-- CreateTable
CREATE TABLE "DemandMatch" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "pinnedById" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandMatch_demandId_idx" ON "DemandMatch"("demandId");

-- CreateIndex
CREATE INDEX "DemandMatch_portfolioId_idx" ON "DemandMatch"("portfolioId");

-- CreateIndex
CREATE INDEX "DemandMatch_officeId_idx" ON "DemandMatch"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandMatch_demandId_portfolioId_key" ON "DemandMatch"("demandId", "portfolioId");

-- AddForeignKey
ALTER TABLE "DemandMatch" ADD CONSTRAINT "DemandMatch_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandMatch" ADD CONSTRAINT "DemandMatch_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandMatch" ADD CONSTRAINT "DemandMatch_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandMatch" ADD CONSTRAINT "DemandMatch_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
