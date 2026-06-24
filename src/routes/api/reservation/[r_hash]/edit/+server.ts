import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { logger } from '$lib/logger';
import { prisma } from '$lib/server/db/prismaConnection';
import { AusleihStatus } from '@prisma/client';
import { isEditableStatus } from '$lib/services/reservationStateService';
import { getItemAvailabilityForAll } from '$lib/server/db/ItemAvailability';
import { sendReservationEditedEmail } from '$lib/server/emailService/emailService';

const EditItemSchema = z.object({
	itemId: z.string(),
	beantragt: z.number().int().min(1)
});

const EditRequestSchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	items: z.array(EditItemSchema).optional()
});

interface ChangeLog {
	type: 'user_edit';
	previousStatus: string;
	changes: {
		dates?: {
			old: { startDate: string; endDate: string };
			new: { startDate: string; endDate: string };
		};
		items?: {
			added: Array<{ itemId: string; articleName: string; beantragt: number }>;
			removed: Array<{ itemId: string; articleName: string; previousBeantragt: number }>;
			modified: Array<{ itemId: string; articleName: string; previousBeantragt: number; newBeantragt: number }>;
		};
	};
}

export async function PUT({ params, request, locals }) {
	const r_hash = params.r_hash;
	const isAdmin = !!locals.user;

	try {
		const body = await request.json();
		const validatedBody = EditRequestSchema.parse(body);

		// Load reservation
		const ausleihe = await prisma.ausleihe.findUnique({
			where: { id: r_hash }
		});

		if (!ausleihe) {
			throw error(404, 'Ausleihe nicht gefunden');
		}

		// Check if status allows editing
		if (!isEditableStatus(ausleihe.ausleihStatus)) {
			throw error(400, 'Bearbeitung in diesem Status nicht möglich');
		}

		// Load current items
		const currentItems = await prisma.ausleiheItem.findMany({
			where: { ausleiheId: r_hash },
			include: { item: true }
		});

		const previousStatus = ausleihe.ausleihStatus;
		const changeLog: ChangeLog = {
			type: 'user_edit',
			previousStatus,
			changes: {}
		};

		// Determine new dates
		const newStartDate = validatedBody.startDate || ausleihe.startDate;
		const newEndDate = validatedBody.endDate || ausleihe.endDate;
		const datesChanged = newStartDate !== ausleihe.startDate || newEndDate !== ausleihe.endDate;

		if (datesChanged) {
			changeLog.changes.dates = {
				old: { startDate: ausleihe.startDate, endDate: ausleihe.endDate },
				new: { startDate: newStartDate, endDate: newEndDate }
			};
		}

		// Determine new items
		const newItems = validatedBody.items || currentItems.map(i => ({ itemId: i.itemId, beantragt: i.beantragt }));

		// Check availability for all items (excluding current reservation)
		const availabilityMap = await getItemAvailabilityForAllExcluding(newStartDate, newEndDate, r_hash);

		// Validate availability
		for (const item of newItems) {
			const availability = availabilityMap.get(item.itemId);
			if (!availability) {
				const itemInfo = await prisma.item.findUnique({ where: { id: item.itemId }, select: { articleName: true } });
				throw error(400, `Artikel "${itemInfo?.articleName || item.itemId}" nicht gefunden`);
			}
			if (availability.verfuegbGes < item.beantragt) {
				const itemInfo = await prisma.item.findUnique({ where: { id: item.itemId }, select: { articleName: true } });
				throw error(400, `Nicht genügend "${itemInfo?.articleName || item.itemId}" verfügbar. Verfügbar: ${availability.verfuegbGes}, Beantragt: ${item.beantragt}`);
			}
		}

		// Calculate item changes
		const currentItemMap = new Map(currentItems.map(i => [i.itemId, i]));
		const newItemMap = new Map(newItems.map(i => [i.itemId, i]));

		const addedItems: ChangeLog['changes']['items']['added'] = [];
		const removedItems: ChangeLog['changes']['items']['removed'] = [];
		const modifiedItems: ChangeLog['changes']['items']['modified'] = [];

		// Find added and modified items
		for (const [itemId, newItem] of newItemMap) {
			const currentItem = currentItemMap.get(itemId);
			const itemInfo = await prisma.item.findUnique({ where: { id: itemId }, select: { articleName: true } });
			const articleName = itemInfo?.articleName || itemId;

			if (!currentItem) {
				addedItems.push({ itemId, articleName, beantragt: newItem.beantragt });
			} else if (currentItem.beantragt !== newItem.beantragt) {
				modifiedItems.push({
					itemId,
					articleName,
					previousBeantragt: currentItem.beantragt,
					newBeantragt: newItem.beantragt
				});
			}
		}

		// Find removed items
		for (const [itemId, currentItem] of currentItemMap) {
			if (!newItemMap.has(itemId)) {
				removedItems.push({
					itemId,
					articleName: currentItem.item.articleName,
					previousBeantragt: currentItem.beantragt
				});
			}
		}

		// Non-admins cannot modify or remove approved items (genehmigt > 0)
		if (!isAdmin) {
			for (const modified of modifiedItems) {
				const currentItem = currentItemMap.get(modified.itemId);
				if (currentItem && currentItem.genehmigt > 0) {
					throw error(403, `Artikel "${modified.articleName}" wurde bereits genehmigt und kann nicht mehr geändert werden`);
				}
			}
			for (const removed of removedItems) {
				const currentItem = currentItemMap.get(removed.itemId);
				if (currentItem && currentItem.genehmigt > 0) {
					throw error(403, `Artikel "${removed.articleName}" wurde bereits genehmigt und kann nicht entfernt werden`);
				}
			}
		}

		const itemsChanged = addedItems.length > 0 || removedItems.length > 0 || modifiedItems.length > 0;

		if (itemsChanged) {
			changeLog.changes.items = { added: addedItems, removed: removedItems, modified: modifiedItems };
		}

		// If nothing changed, return early
		if (!datesChanged && !itemsChanged) {
			return json({ message: 'Keine Änderungen vorgenommen' });
		}

		// Perform the update in a transaction
		await prisma.$transaction(async (tx) => {
			// Update Ausleihe (dates and status)
			await tx.ausleihe.update({
				where: { id: r_hash },
				data: {
					startDate: newStartDate,
					endDate: newEndDate,
					ausleihStatus: AusleihStatus.Verifiziert
				}
			});

			// Delete removed items
			for (const removed of removedItems) {
				await tx.ausleiheItem.deleteMany({
					where: {
						ausleiheId: r_hash,
						itemId: removed.itemId
					}
				});
			}

			// Update modified items (reset genehmigt to 0)
			for (const modified of modifiedItems) {
				await tx.ausleiheItem.updateMany({
					where: {
						ausleiheId: r_hash,
						itemId: modified.itemId
					},
					data: {
						beantragt: modified.newBeantragt,
						genehmigt: 0
					}
				});
			}

			// Add new items
			for (const added of addedItems) {
				await tx.ausleiheItem.create({
					data: {
						ausleiheId: r_hash,
						itemId: added.itemId,
						beantragt: added.beantragt,
						genehmigt: 0,
						zurueckgebracht: 0
					}
				});
			}

			// Reset genehmigt for unchanged items if dates changed
			if (datesChanged) {
				const unchangedItemIds = [...newItemMap.keys()].filter(
					id => !addedItems.some(a => a.itemId === id) && !modifiedItems.some(m => m.itemId === id)
				);
				if (unchangedItemIds.length > 0) {
					await tx.ausleiheItem.updateMany({
						where: {
							ausleiheId: r_hash,
							itemId: { in: unchangedItemIds }
						},
						data: {
							genehmigt: 0
						}
					});
				}
			}

			// Create change comment (hidden)
			await tx.ausleiheComment.create({
				data: {
					ausleiheId: r_hash,
					content: JSON.stringify(changeLog),
					author: 'system',
					hidden: true
				}
			});
		});

		// Send email notification to admin team
		const updatedAusleihe = await prisma.ausleihe.findUnique({ where: { id: r_hash } });
		if (updatedAusleihe) {
			try {
				await sendReservationEditedEmail(updatedAusleihe, previousStatus);
			} catch (emailError) {
				logger.error('Failed to send edit notification email:', emailError);
				// Don't fail the request if email fails
			}
		}

		return json({
			message: 'Reservierung wurde erfolgreich bearbeitet. Status wurde auf "Verifiziert" zurückgesetzt.',
			changes: changeLog.changes
		});

	} catch (err) {
		if (err instanceof z.ZodError) {
			logger.error('Validation error:', err.errors);
			throw error(400, 'Ungültige Eingabedaten');
		}
		logger.error('Error editing reservation:', err);
		throw err;
	}
}

// Helper function to get availability excluding a specific reservation
async function getItemAvailabilityForAllExcluding(
	startDate: string,
	endDate: string,
	excludeAusleiheId: string
) {
	logger.debug('getItemAvailabilityForAllExcluding', { startDate, endDate, excludeAusleiheId });

	// Find active AusleiheItems that overlap the time window, excluding current reservation
	const aggregatedItems = await prisma.ausleiheItem.groupBy({
		by: ['itemId'],
		where: {
			ausleihe: {
				id: { not: excludeAusleiheId },
				startDate: { lte: endDate },
				endDate: { gte: startDate },
				ausleihStatus: {
					notIn: [AusleihStatus.Storniert, AusleihStatus.Abgeschlossen, AusleihStatus.AbgeschlUnvollst]
				}
			}
		},
		_sum: {
			genehmigt: true,
			zurueckgebracht: true,
			beantragt: true
		}
	});

	const aggregatedItemsMap = new Map(
		aggregatedItems.map((item) => [
			item.itemId,
			{
				genehmigt: item._sum.genehmigt || 0,
				zurueckgebracht: item._sum.zurueckgebracht || 0,
				beantragt: item._sum.beantragt || 0
			}
		])
	);

	const itemsWithQuantities = await prisma.item.findMany({
		select: { id: true, quantity: true }
	});

	const resultMap = new Map<string, { quantity: number; verfuegbGes: number }>();

	for (const item of itemsWithQuantities) {
		const entry = aggregatedItemsMap.get(item.id);
		if (entry) {
			resultMap.set(item.id, {
				quantity: item.quantity,
				verfuegbGes: item.quantity - entry.genehmigt + entry.zurueckgebracht
			});
		} else {
			resultMap.set(item.id, {
				quantity: item.quantity,
				verfuegbGes: item.quantity
			});
		}
	}

	return resultMap;
}
