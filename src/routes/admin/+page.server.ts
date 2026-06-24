import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";

export const load: PageServerLoad = async () => {
	const [
		activeLoans,
		overdueLoans,
		totalItems,
		defectItems,
		recentReservations,
	] = await Promise.all([
		prisma.ausleihe.count({
			where: {
				ausleihStatus: { in: ["Reserviert", "Gebucht", "ImGange"] },
			},
		}),
		prisma.ausleihe.count({
			where: {
				ausleihStatus: "ImGange",
				endDate: { lt: new Date().toISOString().split("T")[0] },
			},
		}),
		prisma.item.count(),
		prisma.item.count({
			where: {
				itemStatus: { in: ["Defekt", "WartungErforderlich"] },
			},
		}),
		prisma.ausleihe.findMany({
			take: 5,
			orderBy: { startDate: "desc" },
			include: {
				AusleiheItems: true,
			},
		}),
	]);

	const pendingCount = await prisma.ausleihe.count({
		where: {
			ausleihStatus: { in: ["Angemeldet", "Verifiziert"] },
		},
	});

	return {
		stats: {
			activeLoans,
			overdueLoans,
			totalItems,
			defectItems,
			pendingCount,
		},
		recentReservations,
	};
};
