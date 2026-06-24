# Mitwirken am Ausleihsystem

Schön, dass du beitragen möchtest! Dieses Dokument fasst die wichtigsten Regeln und Abläufe zusammen.

## Verhaltenskodex

Wir wollen ein freundliches und respektvolles Projekt sein. Diskutiere fachlich, nimm Kritik nicht persönlich und behandle andere so, wie du selbst behandelt werden möchtest.

## Issues

Bevor du ein Issue eröffnest:

- **Suche zuerst** in den bestehenden Issues, ob das Thema bereits diskutiert wird.
- Gib bei **Bug-Reports** an: erwartetes Verhalten, tatsächliches Verhalten, Reproduktionsschritte, Umgebung (OS, Browser, Node-Version).
- Bei **Feature-Wünschen**: erkläre das *Warum* (welches Problem löst es?), nicht nur das *Was*.

## Pull Requests

1. **Fork** des Repos und neuen Branch anlegen:
   ```bash
   git checkout -b feat/<kurze-beschreibung>
   ```
2. Änderungen vornehmen und **fokussiert halten** – ein PR pro Thema.
3. Vor dem Push lokal prüfen:
   ```bash
   npm run lint
   npm run check
   npm run test
   ```
4. PR gegen `main` öffnen mit:
   - aussagekräftigem Titel (Conventional-Commit-Stil, s.u.)
   - Beschreibung: was ändert sich, warum, ggf. Screenshots
   - Verweis auf zugehöriges Issue (`Closes #123`)

## Commit-Nachrichten

Wir folgen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <kurze Beschreibung>
```

Gängige Typen:

| Typ        | Wofür                                                            |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | Neues Feature                                                    |
| `fix`      | Bugfix                                                           |
| `refactor` | Umbau ohne Verhaltensänderung                                    |
| `docs`     | Doku-Änderungen                                                  |
| `chore`    | Build, Tooling, Dependencies                                     |
| `test`     | Tests hinzufügen oder anpassen                                   |
| `style`    | Formatierung, kein Code-Verhalten                                |

Beispiele:

```
feat(reservation): Storno-Grund pflegen können
fix(login): 403 hinter Reverse Proxy beheben
docs(readme): Setup-Schritte präzisieren
```

## Code-Stil

- **Sprache der UI:** Deutsch
- **Sprache von Code-Identifiern:** Englisch (Funktions-/Variablennamen), Domänenbegriffe wie `Ausleihe`, `Pfand`, `Standort` dürfen deutsch bleiben.
- **Formatierung:** Prettier (`npm run prettier:fix`)
- **Linting:** ESLint (`npm run lint`)
- **Typen:** TypeScript – wenn möglich keine `any`.

## Datenbank-Änderungen

- Schema-Änderungen erfolgen in [`prisma/schema.prisma`](prisma/schema.prisma).
- Nach jeder Änderung Migration erzeugen:
  ```bash
  npx prisma migrate dev --name <kurze-beschreibung>
  ```
- Auto-generierte Zod-Typen in `src/lib/generated/zod/` **nicht** manuell editieren – `npx prisma generate` regeneriert sie.
- Beschreibe in der PR, warum die Migration nötig ist und ob es Risiken für bestehende Daten gibt.

## Lizenz

Mit deinem Beitrag erklärst du dich einverstanden, dass dein Code unter der [MIT-Lizenz](LICENSE) veröffentlicht wird.

## Fragen?

Eröffne einfach ein Issue mit dem Label `question` – wir helfen gerne.
