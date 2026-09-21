import { z } from 'zod';
import type { AusleihStatusType as PrismaAusleihStatus } from '$lib/generated/zod';

/**
 * Die Ausleih-Status als eigenes Modul.
 *
 * Bewusst nicht aus `$lib/generated/zod` importiert: Diese Datei zieht ueber
 * `import { Prisma } from '@prisma/client'` den Prisma-Client ins Bundle. Im
 * Browser laesst sich der nicht aufloesen ("Failed to resolve module specifier
 * .prisma/client/index-browser"), wodurch die Seite beim Hydrieren abbricht.
 * Browser-Code nutzt daher dieses Modul, Server-Code weiterhin das Generat.
 */
export const AusleihStatusSchema = z.enum([
	'Angemeldet',
	'Verifiziert',
	'Reserviert',
	'Gebucht',
	'ImGange',
	'Abgeschlossen',
	'AbgeschlUnvollst',
	'Storniert'
]);

export type AusleihStatusType = z.infer<typeof AusleihStatusSchema>;

/**
 * Bleibt die Liste oben mit dem Prisma-Enum in Deckung? Weicht sie ab, meldet
 * `npm run check` hier einen Fehler. Rein auf Typebene, landet nicht im Bundle.
 */
type Deckungsgleich<A extends B, B extends A> = true;
export type _StatusInSync = Deckungsgleich<AusleihStatusType, PrismaAusleihStatus>;
