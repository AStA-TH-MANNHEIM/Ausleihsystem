#!/bin/bash
#
# Löscht Ausleih-Datensätze älter als RETENTION_DAYS Tage sowie
# explizit zum Löschen markierte Einträge (deleteMe = true).
#
# Beispiel-Crontab:
#   0 3 * * * /opt/ausleihsystem/scripts/data_retention_policy.sh
#
# Konfiguration über Umgebungsvariablen:
#   POSTGRES_CONTAINER  Name des Postgres-Containers (Standard: ausleihsystem_postgres)
#   PG_USER             DB-User (Standard: postgres)
#   PG_DB               DB-Name (Standard: ausleihsystem)
#   RETENTION_DAYS      Aufbewahrungsdauer in Tagen (Standard: 90)

set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ausleihsystem_postgres}"
PG_USER="${PG_USER:-postgres}"
PG_DB="${PG_DB:-ausleihsystem}"
RETENTION_DAYS="${RETENTION_DAYS:-90}"

docker exec -i "${POSTGRES_CONTAINER}" \
    psql -U "${PG_USER}" -d "${PG_DB}" \
    -c "DELETE FROM \"Ausleihe\" WHERE \"timestamp\" < NOW() - INTERVAL '${RETENTION_DAYS} days';"

docker exec -i "${POSTGRES_CONTAINER}" \
    psql -U "${PG_USER}" -d "${PG_DB}" \
    -c "DELETE FROM \"Ausleihe\" WHERE \"deleteMe\" = true;"
