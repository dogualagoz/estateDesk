-- AlterTable
ALTER TABLE "Demand" ADD COLUMN     "bonusFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'SALE',
ADD COLUMN     "maxArea" INTEGER,
ADD COLUMN     "minArea" INTEGER,
ADD COLUMN     "mustHaveFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "neighborhood" TEXT;

-- CreateIndex
CREATE INDEX "Demand_listingType_city_status_idx" ON "Demand"("listingType", "city", "status");
