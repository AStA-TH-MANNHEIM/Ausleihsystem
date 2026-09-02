import { prisma } from './db/prismaConnection';
import { logger } from '$lib/logger';

export type ItemChangeAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type ItemChangeEntry = {
	field: string;
	label: string;
	oldValue: string | number | null;
	newValue: string | number | null;
};

/** Minimalform des eingeloggten Users, wie ihn `locals.user` liefert. */
export type Actor = { id: string; username: string } | null | undefined;

/** Felder, deren Aenderung protokolliert wird (Reihenfolge = Reihenfolge im Log). */
const TRACKED_FIELDS: Array<{ field: string; label: string }> = [
	{ field: 'articleName', label: 'Artikelname' },
	{ field: 'bezeichnung', label: 'Bezeichnung' },
	{ field: 'description', label: 'Beschreibung' },
	{ field: 'itemStatus', label: 'Status' },
	{ field: 'quantity', label: 'Menge' },
	{ field: 'defectQuantity', label: 'Defekte Menge' },
	{ field: 'standortId', label: 'Standort' },
	{ field: 'kaufdatum', label: 'Kaufdatum' },
	{ field: 'kaufpreis', label: 'Kaufpreis (ct)' }
];

export const ITEM_ACTION_LABELS: Record<ItemChangeAction, string> = {
	CREATE: 'Hinzugefügt',
	UPDATE: 'Bearbeitet',
	DELETE: 'Gelöscht'
};

export function itemLabelOf(item: { id: string; articleName?: string | null; bezeichnung?: string | null }): string {
	const parts = [item.articleName, item.bezeichnung].filter((p) => p && p.trim().length > 0);
	return parts.length > 0 ? parts.join(' – ') : item.id;
}

function normalize(value: unknown): string | number | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return formatDate(value);
	if (typeof value === 'number') return value;
	if (typeof value === 'boolean') return value ? 'ja' : 'nein';
	const str = String(value);
	return str.length === 0 ? null : str;
}

function formatDate(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * Ersetzt Standort-Ids durch die lesbaren Standortnamen, damit der Export
 * nicht nur interne Ids enthaelt.
 */
async function resolveStandortNames(changes: ItemChangeEntry[]): Promise<ItemChangeEntry[]> {
	const ids = changes
		.filter((c) => c.field === 'standortId')
		.flatMap((c) => [c.oldValue, c.newValue])
		.map((v) => Number(v))
		.filter((v) => Number.isInteger(v));

	if (ids.length === 0) return changes;

	const locations = await prisma.standort.findMany({
		where: { id: { in: ids } },
		select: { id: true, standort: true }
	});
	const nameById = new Map(locations.map((l) => [l.id, l.standort]));
	const toName = (value: string | number | null) =>
		value === null ? null : (nameById.get(Number(value)) ?? `#${value}`);

	return changes.map((c) =>
		c.field === 'standortId'
			? { ...c, oldValue: toName(c.oldValue), newValue: toName(c.newValue) }
			: c
	);
}

/** Vergleicht zwei Item-Zustaende und liefert nur die tatsaechlich geaenderten Felder. */
export function diffItem(before: Record<string, unknown>, after: Record<string, unknown>): ItemChangeEntry[] {
	const changes: ItemChangeEntry[] = [];
	for (const { field, label } of TRACKED_FIELDS) {
		if (!(field in after)) continue;
		const oldValue = normalize(before[field]);
		const newValue = normalize(after[field]);
		if (oldValue !== newValue) {
			changes.push({ field, label, oldValue, newValue });
		}
	}
	return changes;
}

/** Schreibt einen Eintrag in die Inventar-Historie. Fehler brechen den Aufrufer nicht ab. */
async function writeLog(
	action: ItemChangeAction,
	item: { id: string; articleName?: string | null; bezeichnung?: string | null },
	actor: Actor,
	changes: ItemChangeEntry[]
): Promise<void> {
	try {
		await prisma.itemChangeLog.create({
			data: {
				action,
				itemId: item.id,
				itemLabel: itemLabelOf(item),
				actorName: actor?.username ?? 'Unbekannt',
				actorId: actor?.id ?? null,
				changes
			}
		});
	} catch (err) {
		logger.error('ItemChangeLog konnte nicht geschrieben werden:', err);
	}
}

export async function logItemCreated(
	item: { id: string; articleName?: string | null; bezeichnung?: string | null } & Record<string, unknown>,
	actor: Actor
): Promise<void> {
	const changes = TRACKED_FIELDS.filter(({ field }) => field in item)
		.map(({ field, label }) => ({ field, label, oldValue: null, newValue: normalize(item[field]) }))
		.filter((c) => c.newValue !== null);
	await writeLog('CREATE', item, actor, await resolveStandortNames(changes));
}

export async function logItemUpdated(
	before: { id: string; articleName?: string | null; bezeichnung?: string | null } & Record<string, unknown>,
	after: Record<string, unknown>,
	actor: Actor
): Promise<void> {
	const changes = diffItem(before, after);
	if (changes.length === 0) return;
	await writeLog(
		'UPDATE',
		{ ...before, ...after, id: before.id } as any,
		actor,
		await resolveStandortNames(changes)
	);
}

export async function logItemDeleted(
	item: { id: string; articleName?: string | null; bezeichnung?: string | null },
	actor: Actor
): Promise<void> {
	await writeLog('DELETE', item, actor, []);
}

/** Ersteller-Felder fuer `prisma.item.create` aus dem eingeloggten User. */
export function creatorFields(actor: Actor): { createdById: string | null; createdByName: string | null } {
	return {
		createdById: actor?.id ?? null,
		createdByName: actor?.username ?? null
	};
}
