# reservation
Userseitige Reservierungen.

## new 
Für das Anlegen neuer Reservierungen 

## "r_hash"
Für das einsehen von Reservierungen.
Der link für das Einsehen von Reserverungen wir an die Email gesendet, die beim erstellen der Reservierung angegeben wurde.
Jede Persoon mit dem Zugriff auf die Reservierung haben. (So können Fachschaften ausleiehen einsehen, da sie zugriff auf die email haben)

In r_hash sollen Reservierungen auch Storniert werden können, aber nur, wenn sie noch nicht laufen etc.

```mermaid
stateDiagram-v2
  [*] --> Angemeldet: S=Ausleihe-Formular, A=Email-Aktivierungs/-Stornierungslink*
  Angemeldet --> Storniert
  Angemeldet --> Verifiziert: S=Aktivierungslink*/Adminpanel
  Verifiziert --> Storniert: S=Stornierungslink*/Adminpanel
  Verifiziert --> Reserviert: C=Ein oder mehr Items sind genehmigt, A=Email-Buchungslink*
  Reserviert --> Storniert: S=Stornierungslink*/Adminpanel
  Reserviert --> Gebucht: S=Buchungslink*/Adminpanel
  Gebucht --> Storniert
  Gebucht --> ImGange: C=Betreuer ist zugewiesen
  ImGange --> Abgeschlossen: C=Alle Items sind zurueck
  ImGange --> AbgeschlUnvollst: C=Items fehlen, A=Anzahl Items wird korrigiert
  AbgeschlUnvollst --> [*]
  Abgeschlossen --> [*]
  Storniert --> [*]


S: Signal von außen, das zum Zustandswechsel (state transition) führt, sofern die Bedingung (C) erfüllt ist
        Wenn S nicht angegeben, ist das Signal die explizite Zustandsänderung im Admin-Panel
C: Erforderliche Bedingung (condition) für den Zustandswechsel
A: Aktion(en), sofern essentiell für das Zustandsdiagramm

Die jeweiligen Updates durch Aktivierungslink und Buchungslink können zwar auch durch das Adminpanel erfolgen, das sollte jedoch auf Notfälle oder Testumgebungen beschränkt werden.