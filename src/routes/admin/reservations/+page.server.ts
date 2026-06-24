import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";

export const load: PageServerLoad = async () => {
	const reservations = await prisma.ausleihe.findMany({
		include: {
			AusleiheItems: {
				include: { item: true },
			},
			UserAusgabe: true,
			UserAbholung: true,
		},
		orderBy: { startDate: "desc" },
	});

	return { reservations };
};
