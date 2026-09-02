import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { error } from "@sveltejs/kit";
import { ITEM_ACTION_LABELS, type ItemChangeAction } from "$lib/server/itemChangeLogService";
import {
	buildWhere,
	exportFileName,
	formatChanges,
	NO_ACTOR,
	parseFilters,
} from "$lib/server/itemHistoryQuery";

const COLUMNS = [
	"Zeitpunkt",
	"Aktion",
	"Inventarnummer",
	"Bezeichnung",
	"Benutzer",
	"Benutzer-ID",
	"Änderungen",
];

/** Excel-kompatibles CSV: Semikolon als Trenner, Felder immer gequotet. */
function csvCell(value: string | null | undefined): string {
	return `"${(value ?? "").replace(/"/g, '""')}"`;
}

function formatTimestamp(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return (
		`${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ` +
		`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, "Nicht angemeldet.");
	}

	const filters = parseFilters(url.searchParams);

	const entries = await prisma.itemChangeLog.findMany({
		where: buildWhere(filters),
		orderBy: { timestamp: "asc" },
	});

	const actorName = filters.actorId && filters.actorId !== NO_ACTOR
		? (entries.find((e) => e.actorId === filters.actorId)?.actorName ??
			(await prisma.user.findUnique({ where: { id: filters.actorId } }))?.username)
		: undefined;

	const rows = entries.map((entry) =>
		[
			formatTimestamp(entry.timestamp),
			ITEM_ACTION_LABELS[entry.action as ItemChangeAction] ?? entry.action,
			entry.itemId,
			entry.itemLabel,
			entry.actorName,
			entry.actorId ?? "",
			formatChanges(entry.changes),
		]
			.map(csvCell)
			.join(";"),
	);

	// BOM, damit Excel die Umlaute als UTF-8 erkennt
	const csv = "\uFEFF" + [COLUMNS.map(csvCell).join(";"), ...rows].join("\r\n") + "\r\n";

	return new Response(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${exportFileName(filters, actorName)}"`,
			"Cache-Control": "no-store",
		},
	});
};
