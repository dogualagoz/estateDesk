-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "acceptedByEmail" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
