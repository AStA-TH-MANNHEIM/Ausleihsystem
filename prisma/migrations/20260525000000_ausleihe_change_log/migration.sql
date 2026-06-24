-- CreateEnum
CREATE TYPE "ChangeSource" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ChangeLogStatus" AS ENUM ('PENDING', 'APPLIED', 'SUPERSEDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AusleiheChangeLog" (
    "id" SERIAL NOT NULL,
    "ausleiheId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "ChangeSource" NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorId" TEXT,
    "changes" JSONB NOT NULL,
    "proposedData" JSONB,
    "adminNote" TEXT,
    "status" "ChangeLogStatus" NOT NULL DEFAULT 'APPLIED',
    "confirmationToken" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AusleiheChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AusleiheChangeLog_confirmationToken_key" ON "AusleiheChangeLog"("confirmationToken");

-- CreateIndex
CREATE INDEX "AusleiheChangeLog_ausleiheId_idx" ON "AusleiheChangeLog"("ausleiheId");

-- CreateIndex
CREATE INDEX "AusleiheChangeLog_confirmationToken_idx" ON "AusleiheChangeLog"("confirmationToken");

-- AddForeignKey
ALTER TABLE "AusleiheChangeLog" ADD CONSTRAINT "AusleiheChangeLog_ausleiheId_fkey" FOREIGN KEY ("ausleiheId") REFERENCES "Ausleihe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
