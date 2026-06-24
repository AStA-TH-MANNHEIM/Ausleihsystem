-- CreateTable
CREATE TABLE "LenderType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "LenderType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LenderType_name_key" ON "LenderType"("name");

-- CreateTable
CREATE TABLE "LenderTypePattern" (
    "id" SERIAL NOT NULL,
    "lenderTypeId" INTEGER NOT NULL,
    "pattern" TEXT NOT NULL,
    CONSTRAINT "LenderTypePattern_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "LenderTypePattern" ADD CONSTRAINT "LenderTypePattern_lenderTypeId_fkey"
    FOREIGN KEY ("lenderTypeId") REFERENCES "LenderType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ItemLenderType" (
    "itemId" TEXT NOT NULL,
    "lenderTypeId" INTEGER NOT NULL,
    CONSTRAINT "ItemLenderType_pkey" PRIMARY KEY ("itemId", "lenderTypeId")
);
ALTER TABLE "ItemLenderType" ADD CONSTRAINT "ItemLenderType_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemLenderType" ADD CONSTRAINT "ItemLenderType_lenderTypeId_fkey"
    FOREIGN KEY ("lenderTypeId") REFERENCES "LenderType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default LenderTypes
INSERT INTO "LenderType" ("name", "description") VALUES
    ('Sonstige', 'Allgemeine HS-Mannheim Accounts'),
    ('StudentIn', 'Studierende'),
    ('Fachschaft', 'Fachschaften'),
    ('AStA', 'AStA-Mitglieder');

-- Seed patterns
INSERT INTO "LenderTypePattern" ("lenderTypeId", "pattern")
SELECT lt.id, p.pattern FROM "LenderType" lt
JOIN (VALUES
    ('Sonstige', '@hs-mannheim\.de$'),
    ('StudentIn', '@stud\.hs-mannheim\.de$'),
    ('Fachschaft', 'fachschaft-.@hs-mannheim\.de$'),
    ('AStA', '\.asta@hs-mannheim\.de$')
) AS p(name, pattern) ON lt.name = p.name;

-- Migrate existing item privileges to join table
INSERT INTO "ItemLenderType" ("itemId", "lenderTypeId")
SELECT i."id", lt."id" FROM "Item" i
JOIN "LenderType" lt ON lt."name" = i."itemReservationPrivilige"::text;

-- Drop old column
ALTER TABLE "Item" DROP COLUMN "itemReservationPrivilige";
