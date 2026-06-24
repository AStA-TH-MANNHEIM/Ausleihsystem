#!/bin/bash
#
# Erstellt einen pg_dump des PostgreSQL-Containers, zippt das Ergebnis und
# verschickt es per E-Mail. Gedacht als Cron-Job auf dem Hostsystem.
#
# Beispiel-Crontab:
#   0 2 * * * /opt/ausleihsystem/scripts/backup_pg.sh
#   0 3 * * * find /opt/backups -type f -mtime +30 -delete
#
# Voraussetzungen:
#   - docker (oder podman, dann CONTAINER_CMD anpassen)
#   - zip
#   - mutt (für den Mail-Versand)
#
# Konfiguration über Umgebungsvariablen:
#   POSTGRES_CONTAINER  Name des laufenden Postgres-Containers
#   PG_USER             DB-User (Standard: postgres)
#   PG_DB               DB-Name (Standard: ausleihsystem)
#   BACKUP_DIR          Zielverzeichnis (Standard: /opt/backups)
#   BACKUP_MAIL_TO      Empfänger-Adresse(n), kommagetrennt (optional)

set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ausleihsystem_postgres}"
PG_USER="${PG_USER:-postgres}"
PG_DB="${PG_DB:-ausleihsystem}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
BACKUP_MAIL_TO="${BACKUP_MAIL_TO:-}"

TIMESTAMP="$(date +"%Y%m%d_%H%M")"
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

# Datenbank dumpen
docker exec "${POSTGRES_CONTAINER}" \
    pg_dump -U "${PG_USER}" -d "${PG_DB}" --format=plain \
    > "${BACKUP_FILE}"

# Komprimieren (vermeidet Encoding-Probleme beim Mailversand)
zip -j "${BACKUP_FILE}.zip" "${BACKUP_FILE}"

# Optional: per E-Mail versenden
if [ -n "${BACKUP_MAIL_TO}" ]; then
    mutt -s "PostgreSQL Backup ${TIMESTAMP}" \
         -a "${BACKUP_FILE}.zip" \
         -- "${BACKUP_MAIL_TO}" < /dev/null
fi

# Wiederherstellen (Beispiel, ggf. Dump vorher anpassen):
#   cat "${BACKUP_FILE}" | docker exec -i "${POSTGRES_CONTAINER}" \
#       psql -U "${PG_USER}" -d "${PG_DB}"
