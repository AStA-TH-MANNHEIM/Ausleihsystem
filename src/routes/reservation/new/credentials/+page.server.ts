import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db/prismaConnection';

export const load: PageServerLoad = async () => {
	const lenderTypes = await prisma.lenderType.findMany({
		include: { LenderTypePatterns: true },
		orderBy: { name: 'asc' }
	});

	return { lenderTypes };
};
