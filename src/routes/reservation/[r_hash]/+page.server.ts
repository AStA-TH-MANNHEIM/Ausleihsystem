import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/db/prismaConnection';
import { error, fail } from '@sveltejs/kit';
import { canTransition } from '$lib/services/reservationStateService';
import { sendStatusChangeEmail, sendActionRequiredEmail } from '$lib/server/emailService/emailService';
import { logger } from '$lib/logger';
import {
	cancelPendingChange,
	getActivePendingChange,
	getChangeLogs,
	isStatusEditableForChange
} from '$lib/server/changeLogService';

export const load: PageServerLoad = async ({ params }) => {
	const reservation = await prisma.ausleihe.findUnique({
		where: { id: params.r_hash },
		include: {
			AusleiheItems: {
				include: { item: true }
			},
			AusleiheComments: {
				where: { hidden: false },
				orderBy: { timestamp: 'desc' }
			}
		}
	});

	if (!reservation) {
		throw error(404, 'Ausleihe nicht gefunden');
	}

	const [activePending, changeLogs] = await Promise.all([
		getActivePendingChange(reservation.id),
		getChangeLogs(reservation.id)
	]);

	return {
		reservation,
		activePending,
		changeLogs,
		isEditable: isStatusEditableForChange(reservation.ausleihStatus)
	};
};

export const actions: Actions = {
	verify: async ({ params }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash }
		});

		if (!reservation) return fail(404, { error: 'Nicht gefunden' });

		if (reservation.ausleihStatus !== 'Angemeldet') {
			return fail(400, { error: 'Ausleihe kann nur im Status "Angemeldet" verifiziert werden.' });
		}

		const updated = await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: 'Verifiziert' }
		});

		try {
			await sendActionRequiredEmail(updated);
		} catch (e) {
			logger.error('Failed to send action required email:', e);
		}

		return { success: true };
	},

	cancel: async ({ params }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash }
		});

		if (!reservation) return fail(404, { error: 'Nicht gefunden' });

		if (!canTransition(reservation.ausleihStatus, 'Storniert')) {
			return fail(400, { error: 'Ausleihe kann in diesem Status nicht storniert werden.' });
		}

		const updated = await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: 'Storniert' }
		});

		try {
			await sendStatusChangeEmail(updated);
		} catch (e) {
			logger.error('Failed to send status change email:', e);
		}

		return { success: true };
	},

	cancelPendingChange: async ({ params, request }) => {
		const data = await request.formData();
		const logIdRaw = data.get('logId');
		const logId = parseInt(String(logIdRaw ?? ''), 10);
		if (!Number.isFinite(logId)) return fail(400, { error: 'Ungültige Anfrage.' });

		const existing = await prisma.ausleiheChangeLog.findUnique({ where: { id: logId } });
		if (!existing || existing.ausleiheId !== params.r_hash) {
			return fail(404, { error: 'Änderung nicht gefunden.' });
		}

		const result = await cancelPendingChange(logId);
		if (!result.ok) return fail(400, { error: 'Änderung konnte nicht abgebrochen werden.' });

		return { success: true };
	},

	book: async ({ params }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash }
		});

		if (!reservation) return fail(404, { error: 'Nicht gefunden' });

		if (reservation.ausleihStatus !== 'Reserviert') {
			return fail(400, { error: 'Ausleihe kann nur im Status "Reserviert" gebucht werden.' });
		}

		const updated = await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: 'Gebucht' }
		});

		try {
			await sendActionRequiredEmail(updated);
		} catch (e) {
			logger.error('Failed to send action required email:', e);
		}

		return { success: true };
	}
};
