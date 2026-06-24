-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('Verfuegbar', 'Defekt', 'Gesperrt', 'Verloren', 'WartungErforderlich', 'Aussortiert');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Sonstige', 'StudentIn', 'Fachschaft', 'AStA');

-- CreateEnum
CREATE TYPE "AusleihStatus" AS ENUM ('Angemeldet', 'Verifiziert', 'Reserviert', 'Gebucht', 'ImGange', 'Abgeschlossen', 'AbgeschlUnvollst', 'Storniert');

-- CreateEnum
CREATE TYPE "PfandStatus" AS ENUM ('PfandNichtFestgelegt', 'PfandBezahlt', 'PfandZurueckgegeben');

-- CreateTable
CREATE TABLE "Ausleihe" (
    "id" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "ausleihStatus" "AusleihStatus" NOT NULL DEFAULT 'Angemeldet',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT 'N/A',
    "reason" TEXT NOT NULL DEFAULT 'N/A',
    "pfandBetrag" DOUBLE PRECISION DEFAULT 0,
    "pfandStatus" "PfandStatus" DEFAULT 'PfandNichtFestgelegt',
    "assignedUserId" TEXT,
    "deleteMe" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ausleihe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AusleiheComment" (
    "id" SERIAL NOT NULL,
    "ausleiheId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,
    "login" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL,

    CONSTRAINT "AusleiheComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AusleiheItem" (
    "id" SERIAL NOT NULL,
    "beantragt" INTEGER NOT NULL DEFAULT 0,
    "genehmigt" INTEGER NOT NULL DEFAULT 0,
    "zurueckgebracht" INTEGER NOT NULL DEFAULT 0,
    "ausleiheId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "AusleiheItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "articleName" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "kaufdatum" TIMESTAMP(3) NOT NULL,
    "kaufpreis" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemStatus" "ItemStatus" NOT NULL DEFAULT 'Verfuegbar',
    "itemReservationPrivilige" "UserType" NOT NULL DEFAULT 'AStA',
    "standortId" INTEGER NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "Standort" (
    "id" SERIAL NOT NULL,
    "standort" TEXT NOT NULL,

    CONSTRAINT "Standort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "protected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Standort_standort_key" ON "Standort"("standort");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Ausleihe" ADD CONSTRAINT "Ausleihe_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AusleiheComment" ADD CONSTRAINT "AusleiheComment_ausleiheId_fkey" FOREIGN KEY ("ausleiheId") REFERENCES "Ausleihe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AusleiheItem" ADD CONSTRAINT "AusleiheItem_ausleiheId_fkey" FOREIGN KEY ("ausleiheId") REFERENCES "Ausleihe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AusleiheItem" ADD CONSTRAINT "AusleiheItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
