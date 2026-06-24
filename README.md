# Ausleihsystem

Digitale Bestands- und Ausleihverwaltung für studentische Gremien und vergleichbare Organisationen.

Ursprünglich entwickelt für den **AStA der Technischen Hochschule Mannheim**, um den kompletten Ausleihprozess von Equipment (Kameras, Kabel, Veranstaltungstechnik, …) zu digitalisieren – von der Online-Reservierung über die Ausgabe bis zur Rückgabe.

> Status: aktiv in Entwicklung · Sprache: Deutsch · Lizenz: MIT

---

## Inhaltsverzeichnis

- [Funktionen](#funktionen)
- [Tech-Stack](#tech-stack)
- [Schnellstart](#schnellstart)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Produktivbetrieb mit Docker](#produktivbetrieb-mit-docker)
- [Konfiguration](#konfiguration)
- [Admin-Benutzer anlegen](#admin-benutzer-anlegen)
- [Datenbank-Migrationen](#datenbank-migrationen)
- [Reverse-Proxy / TLS](#reverse-proxy--tls)
- [Projektstruktur](#projektstruktur)
- [Mitwirken](#mitwirken)
- [Lizenz](#lizenz)
- [Danksagungen](#danksagungen)

---

## Funktionen

**Für alle Nutzer:innen**

- Verfügbare Artikel durchsuchen und filtern
- Ausleihen mit Start-/Endzeitraum und Mengenangabe anfragen
- Eigene Reservierungen einsehen und nachverfolgen

**Für Admins / Betreuer:innen**

- Inventar verwalten (Artikel, Standorte, Tags, Komponenten)
- Ausleih-Workflow steuern: `Angemeldet → Verifiziert → Reserviert → Gebucht → ImGange → Abgeschlossen`
- Pfand-Verwaltung (Betrag + Status)
- Zuordnung von Betreuer:innen für Ausgabe und Rücknahme
- Interne Kommentare und Änderungs­historie pro Ausleihe
- Benutzer­verwaltung mit Schutz wichtiger Accounts

---

## Tech-Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Node-Adapter)
- **Sprache:** TypeScript, Svelte
- **Datenbank:** PostgreSQL via [Prisma](https://www.prisma.io/)
- **Validierung:** Zod (via `zod-prisma-types`)
- **Auth:** [Lucia](https://lucia-auth.com/) mit Argon2-Hashing
- **UI:** [Skeleton UI](https://www.skeleton.dev/) + [shadcn-svelte](https://www.shadcn-svelte.com/) + Tailwind CSS
- **E-Mail:** Nodemailer (SMTP)

---

## Schnellstart

```bash
# 1. Repository klonen
git clone https://github.com/<dein-user>/ausleihsystem.git
cd ausleihsystem

# 2. Abhängigkeiten installieren
npm install

# 3. Konfiguration anlegen
cp .env.example .env
# .env mit eigenen Werten füllen (mindestens DATABASE_URL)

# 4. Datenbank vorbereiten (PostgreSQL muss laufen)
npx prisma migrate deploy
npx prisma generate

# 5. Ersten Admin-User anlegen
npm run create-admin -- admin admin@example.org SicheresPasswort

# 6. Dev-Server starten
npm run dev
```

App ist anschließend unter <http://localhost:5173> erreichbar.

---

## Lokale Entwicklung

### Postgres lokal via Docker

Wer keinen eigenen PostgreSQL installieren möchte, kann die mitgelieferte Dev-Compose-Datei nutzen:

```bash
docker compose -f dev-docker-compose.yaml up -d
```

Damit läuft Postgres auf `localhost:5432` mit Benutzer/Passwort `postgres/postgres` und Datenbank `ausleihsystem`. Passe `DATABASE_URL` in `.env` entsprechend an.

### Nützliche npm-Skripte

| Skript                    | Zweck                                                          |
| ------------------------- | -------------------------------------------------------------- |
| `npm run dev`             | Dev-Server mit HMR starten                                     |
| `npm run build`           | Produktions-Build erzeugen                                     |
| `npm run preview`         | Produktions-Build lokal testen                                 |
| `npm run check`           | Svelte-/TypeScript-Check                                       |
| `npm run lint`            | Prettier + ESLint                                              |
| `npm run prettier:fix`    | Code automatisch formatieren                                   |
| `npm run test`            | Vitest-Suite ausführen                                         |
| `npm run prisma-studio`   | Prisma Studio (DB-GUI) öffnen                                  |
| `npm run create-admin`    | Admin-Benutzer anlegen (siehe unten)                           |

---

## Produktivbetrieb mit Docker

Die mitgelieferte `docker-compose.yaml` startet die App zusammen mit einer PostgreSQL-Instanz.

```bash
# .env (für Compose) anlegen und Werte setzen
cp .env.example .env

docker compose up -d --build
```

> **Hinweis:** Die Standardwerte in `docker-compose.yaml` sind als Beispiel gedacht. Setze für den Produktivbetrieb unbedingt eigene, sichere Zugangsdaten und betreibe die App hinter einem TLS-Reverse-Proxy (Caddy, Traefik, Nginx, …).

---

## Konfiguration

Alle Konfiguration läuft über Umgebungsvariablen. Siehe [`.env.example`](.env.example) für die vollständige Liste mit Beschreibungen.

Die wichtigsten Variablen:

| Variable           | Pflicht | Beschreibung                                                    |
| ------------------ | ------- | --------------------------------------------------------------- |
| `DATABASE_URL`     | ja      | PostgreSQL-Verbindungs-String                                   |
| `DOMAIN`           | ja      | Öffentliche URL der Anwendung (für Links in E-Mails)            |
| `ES_DISABLED`      | nein    | `TRUE` deaktiviert den E-Mail-Versand komplett (Dev-Modus)      |
| `ES_HOST` / `ES_USER` / `ES_PASSWORD` | nein | SMTP-Zugangsdaten                              |
| `ES_AUSLEIHE_TEAM` | nein    | Team-Postfach für Benachrichtigungen                            |
| `PROTOCOL_HEADER`, `HOST_HEADER`, … | nein | Header-Mapping hinter Reverse Proxy             |

---

## Admin-Benutzer anlegen

Nach dem ersten Setup muss mindestens ein Admin-Account erzeugt werden:

```bash
npm run create-admin -- <username> <email> <passwort>
```

Wird kein Passwort übergeben, wird ein zufälliges generiert und genau einmal in der Konsole ausgegeben.

---

## Datenbank-Migrationen

Neue Schema-Änderungen anwenden:

```bash
# In Produktion
npx prisma migrate deploy

# In der Entwicklung (interaktiv – erzeugt neue Migration aus schema.prisma)
npx prisma migrate dev
```

Zod-Typen nach Schema-Änderung neu generieren:

```bash
npx prisma generate
```

---

## Reverse-Proxy / TLS

Wird die App hinter einem TLS-terminierenden Reverse-Proxy betrieben, können POST-Requests (z.B. `/login`) ohne korrekt weitergeleitete Header mit `403 Forbidden` fehlschlagen.

Stelle sicher, dass dein Proxy diese Header setzt und weiterleitet:

- `X-Forwarded-Proto`
- `X-Forwarded-Host`
- `X-Forwarded-Port`
- `X-Forwarded-For`

Setze in der App-Umgebung passend dazu `PROTOCOL_HEADER`, `HOST_HEADER`, `PORT_HEADER`, `ADDRESS_HEADER` und `XFF_DEPTH` (siehe `.env.example`).

Bei genau **einer** öffentlichen Domain kann zusätzlich `ORIGIN` gesetzt werden. Bei mehreren Domains leer lassen – SvelteKit leitet den Origin dann aus den Forwarded-Headern ab.

---

## Projektstruktur

```
.
├── prisma/                 # Schema und Migrationen
├── scripts/                # Hilfsskripte (Admin-User, Backup, …)
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte-Komponenten
│   │   ├── generated/zod/  # Auto-generierte Zod-Typen (nicht editieren)
│   │   └── server/         # Server-only Code (DB, Email, Auth)
│   └── routes/             # SvelteKit-Routen
├── static/                 # Statische Assets
├── docker-compose.yaml     # Produktiv-Compose (App + Postgres)
├── dev-docker-compose.yaml # Nur Postgres für lokale Entwicklung
└── dockerfile              # Multi-Stage-Build für die App
```

---

## Mitwirken

Beiträge sind willkommen! Bitte lies vorher [CONTRIBUTING.md](CONTRIBUTING.md).

Kurz zusammengefasst:

- Issues mit klarer Beschreibung und Reproduktionsschritten anlegen
- Commit-Nachrichten folgen den [Conventional Commits](https://www.conventionalcommits.org/)
- Vor dem Push: `npm run lint` und `npm run check` ausführen

---

## Lizenz

Veröffentlicht unter der [MIT-Lizenz](LICENSE).

---

## Danksagungen

- Entwickelt im Auftrag des **AStA der Technischen Hochschule Mannheim**
- Nutzt Daten aus [caniuse-lite](https://github.com/browserslist/caniuse-lite), lizenziert unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) © [Browserslist team](https://github.com/browserslist)
