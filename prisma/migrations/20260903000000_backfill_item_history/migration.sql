-- Alt-Bestand in die Historie uebernehmen.
--
-- Items, die vor Einfuehrung der Historie angelegt wurden, haben keinen Eintrag in
-- "ItemChangeLog" - die Historie waere fuer den gesamten Bestand leer. Ein Benutzer ist
-- fuer diese Items nicht rekonstruierbar (er wurde nie gespeichert), das Anlagedatum
-- dagegen schon: die Inventarnummer hat das Format YYYYMMDD-NN.

-- 1. createdAt aus der Inventarnummer ableiten, damit die Zeitraum-Filter greifen.
--    Nur fuer Items ohne bekannten Ersteller und ohne bestehenden CREATE-Eintrag;
--    Inventarnummern in abweichendem Format behalten den Migrationszeitpunkt.
UPDATE "Item" i
SET "createdAt" = to_timestamp(substring(i."id" from 1 for 8), 'YYYYMMDD')
WHERE i."id" ~ '^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])-\d{2}$'
  AND i."createdByName" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ItemChangeLog" l WHERE l."itemId" = i."id" AND l."action" = 'CREATE'
  );

-- 2. Fuer jedes Item ohne CREATE-Eintrag einen Historien-Eintrag anlegen.
--    actorId bleibt NULL, actorName weist den Eintrag klar als nicht belegbar aus.
INSERT INTO "ItemChangeLog" ("timestamp", "action", "itemId", "itemLabel", "actorName", "actorId", "changes")
SELECT
  i."createdAt",
  'CREATE',
  i."id",
  COALESCE(NULLIF(CONCAT_WS(' – ', NULLIF(i."articleName", ''), NULLIF(i."bezeichnung", '')), ''), i."id"),
  COALESCE(i."createdByName", 'Unbekannt (Alt-Bestand)'),
  i."createdById",
  '[]'::jsonb
FROM "Item" i
WHERE NOT EXISTS (
  SELECT 1 FROM "ItemChangeLog" l WHERE l."itemId" = i."id" AND l."action" = 'CREATE'
);
