import { randomBytes } from 'crypto';
import { prisma } from './db/prismaConnection';
import { logger } from '$lib/logger';

export type ChangeEntry = {
	field: string;
	label: string;
	oldValue: string | number | null;
	newValue: string | number | null;
};

export type EditableScalarFields = {
	startDate: string;
	endDate: string;
	verwendungsort: string;
	verwendungsStart: string;
	verwendungsEnd: string;
	reason: string;
	phone: string;
};

export type EditableItemQuantity = {
	ausleiheItemId: number;
	itemId: string;
	itemLabel: string;
	beantragt: number;
};

export type ProposedNewItem = {
	itemId: string;
	itemLabel: string;
	beantragt: number;
};

export type ProposedSnapshot = {
	scalars: EditableScalarFields;
	items: EditableItemQuantity[];
	newItems: ProposedNewItem[];
};

const SCALAR_LABELS: Record<keyof EditableScalarFields, string> = {
	startDate: 'Startdatum',
	endDate: 'Enddatum',
	verwendungsort: 'Verwendungsort',
	verwendungsStart: 'Verwendung von',
	verwendungsEnd: 'Verwendung bis',
	reason: 'Verwendungszweck',
	phone: 'Telefon'
};

const NON_TERMINAL_EDITABLE_STATUSES = [
	'Angemeldet',
	'Verifiziert',
	'Reserviert',
	'Gebucht',
	'ImGange'
];

export function isStatusEditableForChange(status: string): boolean {
	return NON_TERMINAL_EDITABLE_STATUSES.includes(status);
}

export function buildSnapshotFromAusleihe(ausleihe: {
	startDate: string;
	endDate: string;
	verwendungsort: string;
	verwendungsStart: string;
	verwendungsEnd: string;
	reason: string;
	phone: string;
	AusleiheItems: Array<{
		id: number;
		itemId: string;
		beantragt: number;
		item: { articleName: string; bezeichnung: string };
	}>;
}): ProposedSnapshot {
	return {
		scalars: {
			startDate: ausleihe.startDate,
			endDate: ausleihe.endDate,
			verwendungsort: ausleihe.verwendungsort,
			verwendungsStart: ausleihe.verwendungsStart,
			verwendungsEnd: ausleihe.verwendungsEnd,
			reason: ausleihe.reason,
			phone: ausleihe.phone
		},
		items: ausleihe.AusleiheItems.map((ai) => ({
			ausleiheItemId: ai.id,
			itemId: ai.itemId,
			itemLabel: `${ai.item.articleName} (${ai.item.bezeichnung})`,
			beantragt: ai.beantragt
		})),
		newItems: []
	};
}

export function computeDiff(prev: ProposedSnapshot, next: ProposedSnapshot): ChangeEntry[] {
	const diff: ChangeEntry[] = [];

	(Object.keys(SCALAR_LABELS) as Array<keyof EditableScalarFields>).forEach((key) => {
		const oldValue = prev.scalars[key] ?? '';
		const newValue = next.scalars[key] ?? '';
		if (oldValue !== newValue) {
			diff.push({
				field: `scalar.${key}`,
				label: SCALAR_LABELS[key],
				oldValue,
				newValue
			});
		}
	});

	const prevItemMap = new Map(prev.items.map((i) => [i.ausleiheItemId, i]));
	for (const nextItem of next.items) {
		const prevItem = prevItemMap.get(nextItem.ausleiheItemId);
		if (!prevItem) continue;
		if (prevItem.beantragt !== nextItem.beantragt) {
			diff.push({
				field: `item.${nextItem.ausleiheItemId}.beantragt`,
				label: `Menge: ${nextItem.itemLabel}`,
				oldValue: prevItem.beantragt,
				newValue: nextItem.beantragt
			});
		}
	}

	for (const newItem of next.newItems) {
		if (newItem.beantragt <= 0) continue;
		diff.push({
			field: `newItem.${newItem.itemId}.beantragt`,
			label: `Neuer Gegenstand: ${newItem.itemLabel}`,
			oldValue: null,
			newValue: newItem.beantragt
		});
	}

	return diff;
}

function generateToken(): string {
	return randomBytes(32).toString('hex');
}

export async function getActivePendingChange(ausleiheId: string) {
	return await prisma.ausleiheChangeLog.findFirst({
		where: { ausleiheId, status: 'PENDING' },
		orderBy: { timestamp: 'desc' }
	});
}

export async function getChangeLogs(ausleiheId: string) {
	return await prisma.ausleiheChangeLog.findMany({
		where: { ausleiheId },
		orderBy: { timestamp: 'desc' }
	});
}

/**
 * Creates a PENDING change log for a user-proposed edit. If an existing pending
 * change exists, marks it SUPERSEDED. Returns the new log row (with token).
 */
export async function createPendingUserChange(params: {
	ausleiheId: string;
	actorName: string;
	previous: ProposedSnapshot;
	proposed: ProposedSnapshot;
}) {
	const diff = computeDiff(params.previous, params.proposed);
	if (diff.length === 0) {
		return { log: null, diff };
	}

	const token = generateToken();

	const log = await prisma.$transaction(async (tx) => {
		await tx.ausleiheChangeLog.updateMany({
			where: { ausleiheId: params.ausleiheId, status: 'PENDING' },
			data: { status: 'SUPERSEDED', resolvedAt: new Date() }
		});

		return await tx.ausleiheChangeLog.create({
			data: {
				ausleiheId: params.ausleiheId,
				source: 'USER',
				actorName: params.actorName,
				changes: diff as unknown as object,
				proposedData: params.proposed as unknown as object,
				status: 'PENDING',
				confirmationToken: token
			}
		});
	});

	return { log, diff };
}

/**
 * Applies a pending change identified by its confirmation token.
 * Writes scalar fields + item quantities to the Ausleihe.
 */
export async function confirmPendingChange(token: string) {
	const pending = await prisma.ausleiheChangeLog.findUnique({
		where: { confirmationToken: token }
	});

	if (!pending) {
		return { ok: false as const, reason: 'not_found' as const };
	}
	if (pending.status !== 'PENDING') {
		return { ok: false as const, reason: 'not_pending' as const, log: pending };
	}

	const proposed = pending.proposedData as unknown as ProposedSnapshot | null;
	if (!proposed) {
		return { ok: false as const, reason: 'no_snapshot' as const };
	}

	const updated = await prisma.$transaction(async (tx) => {
		await tx.ausleihe.update({
			where: { id: pending.ausleiheId },
			data: {
				startDate: proposed.scalars.startDate,
				endDate: proposed.scalars.endDate,
				verwendungsort: proposed.scalars.verwendungsort,
				verwendungsStart: proposed.scalars.verwendungsStart,
				verwendungsEnd: proposed.scalars.verwendungsEnd,
				reason: proposed.scalars.reason,
				phone: proposed.scalars.phone
			}
		});

		for (const it of proposed.items) {
			await tx.ausleiheItem.updateMany({
				where: { id: it.ausleiheItemId, ausleiheId: pending.ausleiheId },
				data: { beantragt: it.beantragt }
			});
		}

		for (const ni of proposed.newItems ?? []) {
			if (ni.beantragt <= 0) continue;
			await tx.ausleiheItem.create({
				data: {
					ausleiheId: pending.ausleiheId,
					itemId: ni.itemId,
					beantragt: ni.beantragt
				}
			});
		}

		const log = await tx.ausleiheChangeLog.update({
			where: { id: pending.id },
			data: {
				status: 'APPLIED',
				confirmedAt: new Date(),
				resolvedAt: new Date(),
				confirmationToken: null
			}
		});

		const ausleihe = await tx.ausleihe.findUnique({
			where: { id: pending.ausleiheId }
		});

		return { log, ausleihe };
	});

	logger.debug('Pending change applied', { logId: updated.log.id });

	return { ok: true as const, log: updated.log, ausleihe: updated.ausleihe };
}

export async function cancelPendingChange(logId: number) {
	const pending = await prisma.ausleiheChangeLog.findUnique({ where: { id: logId } });
	if (!pending || pending.status !== 'PENDING') {
		return { ok: false as const };
	}
	await prisma.ausleiheChangeLog.update({
		where: { id: logId },
		data: { status: 'CANCELLED', resolvedAt: new Date(), confirmationToken: null }
	});
	return { ok: true as const };
}

/**
 * Records and applies an admin change in one go.
 * Writes scalar fields + item quantities, creates APPLIED log entry.
 */
export async function applyAdminChange(params: {
	ausleiheId: string;
	actorName: string;
	actorId: string;
	previous: ProposedSnapshot;
	proposed: ProposedSnapshot;
	adminNote?: string;
}) {
	const diff = computeDiff(params.previous, params.proposed);
	if (diff.length === 0) {
		return { log: null, diff, ausleihe: null };
	}

	const result = await prisma.$transaction(async (tx) => {
		await tx.ausleihe.update({
			where: { id: params.ausleiheId },
			data: {
				startDate: params.proposed.scalars.startDate,
				endDate: params.proposed.scalars.endDate,
				verwendungsort: params.proposed.scalars.verwendungsort,
				verwendungsStart: params.proposed.scalars.verwendungsStart,
				verwendungsEnd: params.proposed.scalars.verwendungsEnd,
				reason: params.proposed.scalars.reason,
				phone: params.proposed.scalars.phone
			}
		});

		for (const it of params.proposed.items) {
			await tx.ausleiheItem.updateMany({
				where: { id: it.ausleiheItemId, ausleiheId: params.ausleiheId },
				data: { beantragt: it.beantragt }
			});
		}

		for (const ni of params.proposed.newItems ?? []) {
			if (ni.beantragt <= 0) continue;
			await tx.ausleiheItem.create({
				data: {
					ausleiheId: params.ausleiheId,
					itemId: ni.itemId,
					beantragt: ni.beantragt
				}
			});
		}

		const log = await tx.ausleiheChangeLog.create({
			data: {
				ausleiheId: params.ausleiheId,
				source: 'ADMIN',
				actorName: params.actorName,
				actorId: params.actorId,
				changes: diff as unknown as object,
				adminNote: params.adminNote?.trim() || null,
				status: 'APPLIED',
				confirmedAt: new Date(),
				resolvedAt: new Date()
			}
		});

		const ausleihe = await tx.ausleihe.findUnique({
			where: { id: params.ausleiheId }
		});

		return { log, ausleihe };
	});

	return { log: result.log, diff, ausleihe: result.ausleihe };
}

export function formatDiffForEmail(diff: ChangeEntry[]): string {
	if (diff.length === 0) return '<p><em>(keine Änderungen)</em></p>';
	const rows = diff
		.map(
			(d) =>
				`<tr><td style="padding:4px 8px;border:1px solid #ddd;"><strong>${escapeHtml(d.label)}</strong></td>` +
				`<td style="padding:4px 8px;border:1px solid #ddd;color:#888;text-decoration:line-through;">${escapeHtml(String(d.oldValue ?? ''))}</td>` +
				`<td style="padding:4px 8px;border:1px solid #ddd;color:#0a0;">${escapeHtml(String(d.newValue ?? ''))}</td></tr>`
		)
		.join('');
	return (
		'<table style="border-collapse:collapse;font-size:14px;margin:8px 0;">' +
		'<thead><tr>' +
		'<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Feld</th>' +
		'<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Vorher</th>' +
		'<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Nachher</th>' +
		'</tr></thead>' +
		`<tbody>${rows}</tbody></table>`
	);
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
