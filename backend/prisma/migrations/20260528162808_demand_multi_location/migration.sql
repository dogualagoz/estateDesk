-- AlterTable
ALTER TABLE "Demand" ADD COLUMN     "districts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "neighborhoods" TEXT[] DEFAULT ARRAY[]::TEXT[];
