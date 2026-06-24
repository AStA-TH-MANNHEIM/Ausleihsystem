-- AlterTable: make kaufdatum, kaufpreis, description, standortId optional
ALTER TABLE "Item" ALTER COLUMN "kaufdatum" DROP NOT NULL;
ALTER TABLE "Item" ALTER COLUMN "kaufpreis" SET DEFAULT 0;
ALTER TABLE "Item" ALTER COLUMN "kaufpreis" DROP NOT NULL;
ALTER TABLE "Item" ALTER COLUMN "description" SET DEFAULT '';
ALTER TABLE "Item" ALTER COLUMN "standortId" DROP NOT NULL;
