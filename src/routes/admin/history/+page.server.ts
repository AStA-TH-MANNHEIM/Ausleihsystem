import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { buildWhere, formatChanges, parseFilters } from "$lib/server/itemHistoryQuery";

/** Maximale Anzahl Zeilen in der Web-Ansicht. Der CSV-Export enthaelt immer alle Treffer. */
const PAGE_LIMIT = 500;

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseFilters(url.searchParams);
	const where = buildWhere(filters);

	const [entries, total, users, actors] = await Promise.all([
		prisma.itemChangeLog.findMany({
			where,
			orderBy: { timestamp: "desc" },
			take: PAGE_LIMIT,
		}),
		prisma.itemChangeLog.count({ where }),
		prisma.user.findMany({
			select: { id: true, username: true },
			orderBy: { username: "asc" },
		}),
		// Actor-Ids aus der Historie - unabhaengig davon, ob es den User noch gibt
		prisma.itemChangeLog.groupBy({ by: ["actorId", "actorName"] }),
	]);

	// Geloeschte Benutzer ergaenzen, damit ihre Eintraege filter- und exportierbar bleiben
	const userOptions = new Map(users.map((user) => [user.id, user.username]));
	for (const actor of actors) {
		if (actor.actorId && !userOptions.has(actor.actorId)) {
			userOptions.set(actor.actorId, `${actor.actorName} (gelöscht)`);
		}
	}

	return {
		filters,
		total,
		limit: PAGE_LIMIT,
		users: [...userOptions]
			.map(([id, username]) => ({ id, username }))
			.sort((a, b) => a.username.localeCompare(b.username, "de")),
		entries: entries.map((entry) => ({
			id: entry.id,
			timestamp: entry.timestamp,
			action: entry.action,
			itemId: entry.itemId,
			itemLabel: entry.itemLabel,
			actorName: entry.actorName,
			actorId: entry.actorId,
			changesText: formatChanges(entry.changes),
		})),
	};
};
