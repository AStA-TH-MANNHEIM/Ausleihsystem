import type { Prisma } from '@prisma/client';
import type { ItemChangeAction, ItemChangeEntry } from './itemChangeLogService';

export type HistoryFilters = {
	/** ISO-Datum (YYYY-MM-DD) oder "" */
	from: string;
	/** ISO-Datum (YYYY-MM-DD) oder "" */
	to: string;
	/** User-Id oder "" fuer alle */
	actorId: string;
	/** Aktion oder "" fuer alle */
	action: string;
	/** Freitextsuche ueber Inventarnummer und Bezeichnung */
	q: string;
};

export const HISTORY_ACTIONS: ItemChangeAction[] = ['CREATE', 'UPDATE', 'DELETE'];

/**
 * Sentinel fuer "Eintraege ohne Benutzerzuordnung" (actorId IS NULL) - z. B. der
 * Alt-Bestand, der vor Einfuehrung der Historie angelegt wurde.
 */
export const NO_ACTOR = '__none__';

/** Liest die Filter aus den Query-Parametern. Ohne Angabe: laufendes Kalenderjahr. */
export function parseFilters(params: URLSearchParams): HistoryFilters {
	const hasRange = params.has('from') || params.has('to');
	const currentYear = new Date().getFullYear();

	return {
		from: hasRange ? (params.get('from') ?? '') : `${currentYear}-01-01`,
		to: hasRange ? (params.get('to') ?? '') : `${currentYear}-12-31`,
		actorId: params.get('actorId') ?? '',
		action: HISTORY_ACTIONS.includes(params.get('action') as ItemChangeAction)
			? (params.get('action') as string)
			: '',
		q: (params.get('q') ?? '').trim()
	};
}

/** Baut die Prisma-`where`-Klausel aus den Filtern. */
export function buildWhere(filters: HistoryFilters): Prisma.ItemChangeLogWhereInput {
	const where: Prisma.ItemChangeLogWhereInput = {};

	const timestamp: { gte?: Date; lt?: Date } = {};
	const from = parseDateStart(filters.from);
	const to = parseDateEnd(filters.to);
	if (from) timestamp.gte = from;
	if (to) timestamp.lt = to;
	if (timestamp.gte || timestamp.lt) where.timestamp = timestamp;

	if (filters.actorId === NO_ACTOR) where.actorId = null;
	else if (filters.actorId) where.actorId = filters.actorId;
	if (filters.action) where.action = filters.action as ItemChangeAction;
	if (filters.q) {
		where.OR = [
			{ itemId: { contains: filters.q, mode: 'insensitive' } },
			{ itemLabel: { contains: filters.q, mode: 'insensitive' } }
		];
	}

	return where;
}

/** Beginn des Tages (lokale Zeit), oder null bei leerer/ungueltiger Eingabe. */
function parseDateStart(value: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00`);
	return isNaN(date.getTime()) ? null : date;
}

/** Exklusive Obergrenze: Beginn des Folgetages, damit der `to`-Tag vollstaendig enthalten ist. */
function parseDateEnd(value: string): Date | null {
	const start = parseDateStart(value);
	if (!start) return null;
	start.setDate(start.getDate() + 1);
	return start;
}

/** Formatiert die Aenderungsliste als lesbaren Text (fuer Tabelle und CSV). */
export function formatChanges(changes: unknown): string {
	if (!Array.isArray(changes)) return '';
	return (changes as ItemChangeEntry[])
		.map((c) => {
			const oldValue = c.oldValue === null || c.oldValue === undefined ? '—' : String(c.oldValue);
			const newValue = c.newValue === null || c.newValue === undefined ? '—' : String(c.newValue);
			return `${c.label}: ${oldValue} → ${newValue}`;
		})
		.join(' | ');
}

/** Baut den Dateinamen des Exports aus dem gewaehlten Zeitraum. */
export function exportFileName(filters: HistoryFilters, actorName?: string): string {
	const parts = ['inventar-historie'];
	if (filters.actorId === NO_ACTOR) actorName = 'ohne-Benutzer';
	if (actorName) parts.push(actorName.replace(/[^a-zA-Z0-9-_]/g, '_'));
	if (filters.from) parts.push(filters.from);
	if (filters.to) parts.push(`bis-${filters.to}`);
	return `${parts.join('_')}.csv`;
}
