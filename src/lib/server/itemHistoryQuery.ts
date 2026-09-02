import type { Prisma } from '@prisma/client';
import type { ItemChangeAction, ItemChangeEntry } from './itemChangeLogService';

export type HistoryFilters = {
	/** ISO-Datum (YYYY-MM-DD) oder "" */
	from: string;
	/** ISO-Datum (YYYY-MM-DD) oder "" */
	to: string;
	/** Unveraenderte Eingabe des Benutzers, fuer Formular und Fehlerhinweis */
	fromInput: string;
	toInput: string;
	/** User-Id, NO_ACTOR oder "" fuer alle */
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

/**
 * Akzeptiert TT.MM.JJJJ (auch 1.1.2026) sowie ISO (JJJJ-MM-TT) und liefert ISO zurueck.
 * Nicht erkannte Eingaben ergeben "" und wirken damit wie "keine Grenze"; die Seite
 * weist auf eine nicht erkannte Eingabe hin, damit sie nicht still ignoriert wird.
 */
export function normalizeDateInput(value: string): string {
	const input = (value ?? '').trim();
	if (!input) return '';

	const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input);
	if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

	const german = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(input);
	if (german) return `${german[3]}-${german[2].padStart(2, '0')}-${german[1].padStart(2, '0')}`;

	return '';
}

/** ISO -> TT.MM.JJJJ fuer die Anzeige im Formular. */
export function formatDateInput(value: string): string {
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : '';
}

/** Liest die Filter aus den Query-Parametern. Ohne Angabe: laufendes Kalenderjahr. */
export function parseFilters(params: URLSearchParams): HistoryFilters {
	const hasRange = params.has('from') || params.has('to');
	const currentYear = new Date().getFullYear();
	const fromInput = (params.get('from') ?? '').trim();
	const toInput = (params.get('to') ?? '').trim();

	return {
		from: hasRange ? normalizeDateInput(fromInput) : `${currentYear}-01-01`,
		to: hasRange ? normalizeDateInput(toInput) : `${currentYear}-12-31`,
		fromInput: hasRange ? fromInput : `01.01.${currentYear}`,
		toInput: hasRange ? toInput : `31.12.${currentYear}`,
		actorId: params.get('actorId') ?? '',
		action: HISTORY_ACTIONS.includes(params.get('action') as ItemChangeAction)
			? (params.get('action') as string)
			: '',
		q: (params.get('q') ?? '').trim()
	};
}

/** Eingabe war gefuellt, liess sich aber nicht als Datum lesen. */
export function invalidDateInputs(filters: HistoryFilters): string[] {
	const invalid: string[] = [];
	if (filters.fromInput && !filters.from) invalid.push('Von');
	if (filters.toInput && !filters.to) invalid.push('Bis');
	return invalid;
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
