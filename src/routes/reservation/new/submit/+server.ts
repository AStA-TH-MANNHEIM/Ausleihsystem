import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db/prismaConnection';
import { inferLenderTypes } from '$lib/services/lenderTypeService';
import { getItemAvailabilityForAll } from '$lib/server/db/ItemAvailability';
import { sendVerifyEmail, sendActionRequiredEmail } from '$lib/server/emailService/emailService';
import { credentialsSchema } from '../(schemas)/credentialsSchema';
import { dateSchema } from '../(schemas)/dateSchema';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '$lib/logger';

const itemsSchema = z.array(
	z.object({
		itemId: z.string().min(1),
		quantity: z.number().int().min(1)
	})
).min(1, { message: 'Bitte wähle mindestens einen Gegenstand aus.' });

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate credentials
		const credResult = credentialsSchema.safeParse(body);
		if (!credResult.success) {
			return json({ error: credResult.error.issues[0].message }, { status: 400 });
		}

		// Validate dates
		const dateResult = dateSchema.safeParse(body);
		if (!dateResult.success) {
			return json({ error: dateResult.error.issues[0].message }, { status: 400 });
		}

		// Validate items
		const itemsResult = itemsSchema.safeParse(body.items);
		if (!itemsResult.success) {
			return json({ error: itemsResult.error.issues[0].message }, { status: 400 });
		}

		// Infer LenderTypes from the email (no manual selection anymore)
		const matchedTypes = await inferLenderTypes(credResult.data.email);
		const matchedTypeIds = matchedTypes.map((lt) => lt.id);
		if (matchedTypes.length === 0) {
			const anyPatterns = await prisma.lenderTypePattern.count();
			if (anyPatterns > 0) {
				return json(
					{
						error: 'Diese E-Mail-Adresse wurde nicht erkannt. Bitte nutze deine Hochschul-E-Mail-Adresse.'
					},
					{ status: 400 }
				);
			}
		}

		// Verify item access: items must be either unrestricted or matching an inferred type
		const requestedItemIds = itemsResult.data.map((i) => i.itemId);
		const items = await prisma.item.findMany({
			where: { id: { in: requestedItemIds } },
			include: { ItemLenderTypes: true }
		});

		const availabilityMap = await getItemAvailabilityForAll(
			dateResult.data.startDate,
			dateResult.data.endDate
		);

		for (const reqItem of itemsResult.data) {
			const dbItem = items.find((i) => i.id === reqItem.itemId);
			if (!dbItem) {
				return json({ error: `Gegenstand ${reqItem.itemId} nicht gefunden.` }, { status: 400 });
			}
			if (dbItem.itemStatus !== 'Verfuegbar') {
				return json(
					{ error: `Gegenstand "${dbItem.articleName}" ist nicht verfügbar.` },
					{ status: 400 }
				);
			}
			// Check LenderType restriction
			if (dbItem.ItemLenderTypes.length > 0) {
				const allowed = dbItem.ItemLenderTypes.some((ilt) =>
					matchedTypeIds.includes(ilt.lenderTypeId)
				);
				if (!allowed) {
					return json(
						{
							error: `Gegenstand "${dbItem.articleName}" ist für deinen Ausleihertyp nicht verfügbar.`
						},
						{ status: 400 }
					);
				}
			}
			// Check requested quantity against availability in the requested window
			const available = Math.max(
				0,
				availabilityMap.get(dbItem.id)?.verfuegbGes ?? dbItem.quantity
			);
			if (reqItem.quantity > available) {
				return json(
					{
						error: `Von "${dbItem.articleName}" sind im gewählten Zeitraum nur ${available} verfügbar.`
					},
					{ status: 400 }
				);
			}
		}

		// Create Ausleihe + AusleiheItems
		const ausleiheId = uuidv4();
		const ausleihe = await prisma.ausleihe.create({
			data: {
				id: ausleiheId,
				startDate: dateResult.data.startDate,
				endDate: dateResult.data.endDate,
				email: credResult.data.email,
				vorname: credResult.data.vorname,
				nachname: credResult.data.nachname,
				phone: credResult.data.phone || 'N/A',
				reason: credResult.data.reason,
				verwendungsort: credResult.data.verwendungsort,
				verwendungsStart: dateResult.data.verwendungsStart || '',
				verwendungsEnd: dateResult.data.verwendungsEnd || '',
				ausleihStatus: 'Angemeldet',
				AusleiheItems: {
					create: itemsResult.data.map((item) => ({
						itemId: item.itemId,
						beantragt: item.quantity
					}))
				}
			}
		});

		// Send emails
		try {
			await sendVerifyEmail(ausleihe.email, ausleihe.id);
		} catch (e) {
			logger.error('Failed to send verify email:', e);
		}

		try {
			await sendActionRequiredEmail(ausleihe);
		} catch (e) {
			logger.error('Failed to send action required email:', e);
		}

		return json({ success: true, id: ausleihe.id });
	} catch (e) {
		logger.error('Reservation submit error:', e);
		return json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, { status: 500 });
	}
};
