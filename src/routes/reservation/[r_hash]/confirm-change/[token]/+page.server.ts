import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { confirmPendingChange } from '$lib/server/changeLogService';
import { sendPendingChangeAppliedEmail } from '$lib/server/emailService/emailService';
import { logger } from '$lib/logger';
import type { ChangeEntry } from '$lib/server/changeLogService';

export const load: PageServerLoad = async ({ params }) => {
	const result = await confirmPendingChange(params.token);

	if (!result.ok) {
		if (result.reason === 'not_found') {
			throw error(404, 'Bestätigungslink ungültig oder bereits verwendet.');
		}
		if (result.reason === 'not_pending') {
			return {
				status: 'already_resolved' as const,
				logStatus: result.log.status,
				ausleiheId: result.log.ausleiheId
			};
		}
		throw error(500, 'Änderung konnte nicht angewendet werden.');
	}

	if (result.ausleihe) {
		try {
			await sendPendingChangeAppliedEmail(
				result.ausleihe,
				result.log.changes as unknown as ChangeEntry[]
			);
		} catch (e) {
			logger.error('Failed to send pending change applied email', e);
		}
	}

	return {
		status: 'confirmed' as const,
		ausleiheId: params.r_hash
	};
};
