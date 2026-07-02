-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "officeId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "userId" TEXT,
    "officeId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_officeId_createdAt_idx" ON "AuditLog"("officeId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestLog_createdAt_idx" ON "RequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "RequestLog_statusCode_createdAt_idx" ON "RequestLog"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "RequestLog_userId_createdAt_idx" ON "RequestLog"("userId", "createdAt");
