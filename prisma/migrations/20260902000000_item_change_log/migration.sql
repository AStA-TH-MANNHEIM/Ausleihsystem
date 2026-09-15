-- CreateEnum
CREATE TYPE "ItemChangeAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
-- Bestehende Items haben keinen bekannten Ersteller: createdById/createdByName bleiben NULL,
-- createdAt wird auf den Migrationszeitpunkt gesetzt.
ALTER TABLE "Item" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdByName" TEXT,
ADD COLUMN     "createdById" TEXT;

-- CreateTable
CREATE TABLE "ItemChangeLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "ItemChangeAction" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorId" TEXT,
    "changes" JSONB NOT NULL,

    CONSTRAINT "ItemChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Item_createdById_idx" ON "Item"("createdById");

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "Item"("createdAt");

-- CreateIndex
CREATE INDEX "ItemChangeLog_timestamp_idx" ON "ItemChangeLog"("timestamp");

-- CreateIndex
CREATE INDEX "ItemChangeLog_actorId_idx" ON "ItemChangeLog"("actorId");

-- CreateIndex
CREATE INDEX "ItemChangeLog_itemId_idx" ON "ItemChangeLog"("itemId");

-- CreateIndex
CREATE INDEX "ItemChangeLog_action_idx" ON "ItemChangeLog"("action");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
