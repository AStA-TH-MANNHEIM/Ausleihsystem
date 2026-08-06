import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db/prismaConnection';
import { getItemAvailabilityForAll } from '$lib/server/db/ItemAvailability';
import { accessibleItemWhere } from '$lib/services/lenderTypeService';

export const load: PageServerLoad = async ({ url }) => {
	const lenderTypeIds = (url.searchParams.get('lenderTypeIds') || '')
		.split(',')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id));
	const startDate = url.searchParams.get('startDate') || '';
	const endDate = url.searchParams.get('endDate') || '';

	// Items filtered by LenderType: either no restriction or matching type
	const items = await prisma.item.findMany({
		where: {
			itemStatus: 'Verfuegbar',
			...accessibleItemWhere(lenderTypeIds)
		},
		include: {
			Standort: true,
			ItemTags: { include: { tag: true } },
			ItemLenderTypes: true
		},
		orderBy: { articleName: 'asc' }
	});

	// Availability map
	let availabilityMap: Map<string, any> = new Map();
	if (startDate && endDate) {
		availabilityMap = await getItemAvailabilityForAll(startDate, endDate);
	}

	// Serialize availability into items
	const itemsWithAvailability = items.map((item) => {
		const avail = availabilityMap.get(item.id);
		const available = avail?.verfuegbGes ?? item.quantity;
		return {
			...item,
			available: Math.max(0, available),
			kaufdatum: item.kaufdatum ? item.kaufdatum.toISOString() : null
		};
	});

	// Load all tags for filtering
	const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });

	return { items: itemsWithAvailability, tags };
};
