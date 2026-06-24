-- AlterTable: Add new fields and rename assignedUserId
ALTER TABLE "Ausleihe" ADD COLUMN "verwendungsort" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Ausleihe" ADD COLUMN "verwendungsStart" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Ausleihe" ADD COLUMN "verwendungsEnd" TEXT NOT NULL DEFAULT '';

-- Rename assignedUserId to assignedUserAusgabeId
ALTER TABLE "Ausleihe" RENAME COLUMN "assignedUserId" TO "assignedUserAusgabeId";

-- Add assignedUserAbholungId
ALTER TABLE "Ausleihe" ADD COLUMN "assignedUserAbholungId" TEXT;

-- AddForeignKey
ALTER TABLE "Ausleihe" ADD CONSTRAINT "Ausleihe_assignedUserAbholungId_fkey" FOREIGN KEY ("assignedUserAbholungId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameForeignKey
ALTER TABLE "Ausleihe" DROP CONSTRAINT IF EXISTS "Ausleihe_assignedUserId_fkey";
ALTER TABLE "Ausleihe" ADD CONSTRAINT "Ausleihe_assignedUserAusgabeId_fkey" FOREIGN KEY ("assignedUserAusgabeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
