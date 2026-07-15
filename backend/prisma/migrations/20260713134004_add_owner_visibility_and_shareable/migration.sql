-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "isShareable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ownerNameVisible" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");
