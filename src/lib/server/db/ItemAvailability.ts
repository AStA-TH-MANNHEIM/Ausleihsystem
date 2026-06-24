import { type Ausleihe } from '$lib/generated/zod';
import { prisma } from '$lib/server/db/prismaConnection';
import { logger } from '$lib/logger';
import { AusleihStatus } from '@prisma/client';

// For new reservations
export async function getItemAvailabilityForAll(startDate: string, endDate: string) {
	logger.debug("getItemAvailabilityForAll");

	// find active AusleiheItems that overlap the time window
	const aggregatedItems = await prisma.ausleiheItem.groupBy({
		by: ['itemId'],
		where: {
			ausleihe: {
				startDate: {
					lte: endDate
				},
				endDate: {
					gte: startDate
				},
			    ausleihStatus: {
					notIn: [AusleihStatus.Storniert, AusleihStatus.Abgeschlossen, AusleihStatus.AbgeschlUnvollst],
				},
			}
		},
		_sum: {
			genehmigt: true,
			zurueckgebracht: true,
			beantragt: true
		}

	});
	logger.debug("aggregatedItems: ",aggregatedItems);

	const aggregatedItemsMap = new Map(
		aggregatedItems.map(
			(item: { itemId: string; _sum: { genehmigt: number | null; zurueckgebracht: number | null; beantragt: number | null} }) => [
				item.itemId,
				{
					genehmigt: item._sum.genehmigt,
					zurueckgebracht: item._sum.zurueckgebracht,
					beantragt: item._sum.beantragt
				}
			]
		)
	);

	const itemsWithQuantities = await prisma.item.findMany({
		select: { id: true, quantity: true },
	});

	for (const item of itemsWithQuantities) {
		const entry = aggregatedItemsMap.get(item.id);
		if (entry) {
			aggregatedItemsMap.set(item.id, {
			...item,
			quantity: item.quantity,
			verfuegbGes:
					item.quantity -
					entry.genehmigt + 
					entry.zurueckgebracht,
			});
		} else {
			aggregatedItemsMap.set(item.id, {
			...item,
			quantity: item.quantity,
			verfuegbGes: item.quantity
			});

		}
	}

	/*
	for (const [itemId, existing] of aggregatedItemsMap.entries()) {
		//logger.debug("...existing:", existing);
		aggregatedItemsMap.set(itemId, {
			...existing,
			verfuegbGes:
					existing.quantity -
					existing.genehmigt + 
					existing.zurueckgebracht,
		});
	}
	*/

	logger.debug("aggregatedItemsMap: ",aggregatedItemsMap);
	
	return aggregatedItemsMap;
}




export async function getItemAvailability(ausleihe: Ausleihe) {

	// Get itemIds for a given ausleiheId
	const ausleiheItemList = await prisma.ausleiheItem.findMany({
	where: {
		ausleiheId: ausleihe.id
	},
	select: {
		id: true,
		itemId: true,
	}
	});

	// Extract the item IDs
	const itemIds = ausleiheItemList.map(item => item.itemId);

	// find active AusleiheItems that overlap the time window
	const aggregatedItems = await prisma.ausleiheItem.groupBy({
		by: ['itemId'],
		where: {
			itemId: {
				in: itemIds
			},
			ausleihe: {
				startDate: {
					lte: ausleihe.endDate
				},
				endDate: {
					gte: ausleihe.startDate
				},
			    ausleihStatus: {
					notIn: [AusleihStatus.Storniert, AusleihStatus.Abgeschlossen, AusleihStatus.AbgeschlUnvollst],
				},
			}
		},
		_sum: {
			genehmigt: true,
			zurueckgebracht: true,
			beantragt: true
		}

	});
	logger.debug("aggregatedItems: ",aggregatedItems);

	const aggregatedItemsMap = new Map(
		aggregatedItems.map(
			(item: { itemId: string; _sum: { genehmigt: number | null; zurueckgebracht: number | null; beantragt: number | null} }) => [
				item.itemId,
				{
					genehmigt: item._sum.genehmigt,
					zurueckgebracht: item._sum.zurueckgebracht,
					beantragt: item._sum.beantragt
				}
			]
		)
	);

	const itemsWithQuantities = await prisma.item.findMany({
		where: { id: { in: itemIds } },
		select: { id: true, quantity: true },
	});

	for (const item of itemsWithQuantities) {
		const entry = aggregatedItemsMap.get(item.id);
		if (entry) {
			aggregatedItemsMap.set(item.id, {
			...entry,
			quantity: item.quantity
			});
		}
	}

	// find earlier ("lt: ausleihe.timestamp") applied ("beantragt") ausleiheItems
	// but we ignore status where items are approved
	const prioItemArray = await prisma.ausleiheItem.groupBy({
		by: ['itemId'],
		where: {
			itemId: {
				in: itemIds
			},
			ausleihe: {
				startDate: {
					lte: ausleihe.endDate
				},
				endDate: {
					gte: ausleihe.startDate
				},
				timestamp: {
					lt: ausleihe.timestamp
				},
			    ausleihStatus: {
					in: [AusleihStatus.Angemeldet, AusleihStatus.Verifiziert],
				},
			}
		},
		_sum: {
			genehmigt: true,
			beantragt: true
		}
	});

	const prioItemMap = new Map(
		prioItemArray.map((entry: any) => [entry.itemId, entry._sum])
	);

	for (const [itemId, existing] of aggregatedItemsMap.entries()) {
		//logger.debug("...existing:", existing);
		const sum = prioItemMap.get(itemId) || {};
		//logger.debug("sum:", sum);
		aggregatedItemsMap.set(itemId, {
			...existing,
			verfuegbGes:
					existing.quantity -
					existing.genehmigt +
					existing.zurueckgebracht,
			vorzuziehendeNachfrage:
				(sum.beantragt ?? 0) - (sum.genehmigt ?? 0),
			verfuegbar:
					existing.quantity -
					existing.genehmigt +
					existing.zurueckgebracht -
					// items earlier applied for ("beantragt) - we ignore them if they are approved ("genehmigt") 
					// since they are already be considered in existing.genehmigt
					((sum.beantragt ?? 0) - (sum.genehmigt ?? 0)),
		});
	}

	logger.debug("aggregatedItemsMap: ",aggregatedItemsMap);
	
	return aggregatedItemsMap;
}
