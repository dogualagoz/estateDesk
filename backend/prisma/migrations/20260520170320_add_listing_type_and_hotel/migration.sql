-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- AlterEnum
ALTER TYPE "PropertyType" ADD VALUE 'HOTEL';

-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'SALE',
ADD COLUMN     "title" TEXT;
