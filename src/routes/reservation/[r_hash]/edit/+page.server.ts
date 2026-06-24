import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/db/prismaConnection';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	buildSnapshotFromAusleihe,
	createPendingUserChange,
	getActivePendingChange,
	isStatusEditableForChange,
	type ProposedSnapshot
} from '$lib/server/changeLogService';
import { sendPendingChangeConfirmationEmail } from '$lib/server/emailService/emailService';
import { accessibleItemWhere, inferLenderTypeIds } from '$lib/services/lenderTypeService';
import { logger } from '$lib/logger';

export const load: PageServerLoad = async ({ params }) => {
	const reservation = await prisma.ausleihe.findUnique({
		where: { id: params.r_hash },
		include: {
			AusleiheItems: {
				include: { item: true }
			}
		}
	});

	if (!reservation) {
		throw error(404, 'Ausleihe nicht gefunden');
	}

	if (!isStatusEditableForChange(reservation.ausleihStatus)) {
		throw error(400, 'Diese Ausleihe kann in ihrem aktuellen Status nicht mehr bearbeitet werden.');
	}

	// Only offer items the applicant's lender type (derived from their email) may access.
	const lenderTypeIds = await inferLenderTypeIds(reservation.email);

	const [activePending, availableItems] = await Promise.all([
		getActivePendingChange(reservation.id),
		prisma.item.findMany({
			where: { itemStatus: 'Verfuegbar', ...accessibleItemWhere(lenderTypeIds) },
			select: {
				id: true,
				articleName: true,
				bezeichnung: true,
				quantity: true
			},
			orderBy: { articleName: 'asc' }
		})
	]);

	const existingItemIds = new Set(reservation.AusleiheItems.map((ai) => ai.itemId));
	const addableItems = availableItems.filter((i) => !existingItemIds.has(i.id));

	return { reservation, activePending, addableItems };
};

export const actions: Actions = {
	propose: async ({ params, request }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
			include: { AusleiheItems: { include: { item: true } } }
		});

		if (!reservation) return fail(404, { error: 'Nicht gefunden' });
		if (!isStatusEditableForChange(reservation.ausleihStatus)) {
			return fail(400, { error: 'Status nicht editierbar.' });
		}

		const data = await request.formData();

		const newItemIdsRaw = data.getAll('newItemId') as string[];
		const existingItemIds = new Set(reservation.AusleiheItems.map((ai) => ai.itemId));
		const newItemIds = Array.from(
			new Set(newItemIdsRaw.filter((id) => id && !existingItemIds.has(id)))
		);

		let newItemsLookup: Record<string, { articleName: string; bezeichnung: string; quantity: number }> = {};
		if (newItemIds.length > 0) {
			// Restrict additions to items the applicant's lender type may access; any
			// disallowed id is silently dropped (not present in the lookup below).
			const lenderTypeIds = await inferLenderTypeIds(reservation.email);
			const items = await prisma.item.findMany({
				where: {
					id: { in: newItemIds },
					itemStatus: 'Verfuegbar',
					...accessibleItemWhere(lenderTypeIds)
				},
				select: { id: true, articleName: true, bezeichnung: true, quantity: true }
			});
			newItemsLookup = Object.fromEntries(items.map((i) => [i.id, i]));
		}

		const proposed: ProposedSnapshot = {
			scalars: {
				startDate: String(data.get('startDate') ?? reservation.startDate).trim(),
				endDate: String(data.get('endDate') ?? reservation.endDate).trim(),
				verwendungsort: String(data.get('verwendungsort') ?? reservation.verwendungsort).trim(),
				verwendungsStart: String(
					data.get('verwendungsStart') ?? reservation.verwendungsStart
				).trim(),
				verwendungsEnd: String(data.get('verwendungsEnd') ?? reservation.verwendungsEnd).trim(),
				reason: String(data.get('reason') ?? reservation.reason).trim(),
				phone: String(data.get('phone') ?? reservation.phone).trim()
			},
			items: reservation.AusleiheItems.map((ai) => {
				const raw = data.get(`item_${ai.id}_beantragt`);
				const parsed = raw !== null ? parseInt(String(raw), 10) : ai.beantragt;
				const newBeantragt =
					Number.isFinite(parsed) && parsed >= 0 ? parsed : ai.beantragt;
				return {
					ausleiheItemId: ai.id,
					itemId: ai.itemId,
					itemLabel: `${ai.item.articleName} (${ai.item.bezeichnung})`,
					beantragt: newBeantragt
				};
			}),
			newItems: newItemIds
				.map((itemId) => {
					const meta = newItemsLookup[itemId];
					if (!meta) return null;
					const raw = data.get(`newItem_${itemId}_beantragt`);
					const parsed = raw !== null ? parseInt(String(raw), 10) : 1;
					const beantragt = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
					if (beantragt <= 0) return null;
					return {
						itemId,
						itemLabel: `${meta.articleName} (${meta.bezeichnung})`,
						beantragt
					};
				})
				.filter((x): x is { itemId: string; itemLabel: string; beantragt: number } => x !== null)
		};

		if (!proposed.scalars.reason) {
			return fail(400, { error: 'Verwendungszweck darf nicht leer sein.' });
		}

		const previous = buildSnapshotFromAusleihe(reservation);

		const { log, diff } = await createPendingUserChange({
			ausleiheId: reservation.id,
			actorName: `${reservation.vorname} ${reservation.nachname}`,
			previous,
			proposed
		});

		if (!log) {
			return fail(400, { error: 'Keine Änderungen erkannt.' });
		}

		try {
			await sendPendingChangeConfirmationEmail(reservation, log.confirmationToken!, diff);
		} catch (e) {
			logger.error('Failed to send pending change confirmation email:', e);
		}

		throw redirect(303, `/reservation/${reservation.id}?changeProposed=1`);
	}
};
