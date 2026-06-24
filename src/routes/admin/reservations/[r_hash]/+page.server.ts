import type { PageServerLoad, Actions } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { error, fail } from "@sveltejs/kit";
import { canTransition } from "$lib/services/reservationStateService";
import {
	applyAdminChange,
	buildSnapshotFromAusleihe,
	getActivePendingChange,
	getChangeLogs,
	isStatusEditableForChange,
	type ProposedSnapshot,
} from "$lib/server/changeLogService";
import { sendAdminChangeInfoEmail } from "$lib/server/emailService/emailService";
import { accessibleItemWhere, inferLenderTypeIds } from "$lib/services/lenderTypeService";
import { logger } from "$lib/logger";

export const load: PageServerLoad = async ({ params }) => {
	const reservation = await prisma.ausleihe.findUnique({
		where: { id: params.r_hash },
		include: {
			AusleiheItems: {
				include: { item: true },
			},
			AusleiheComments: {
				orderBy: { timestamp: "desc" },
			},
			UserAusgabe: true,
			UserAbholung: true,
		},
	});

	if (!reservation) {
		throw error(404, "Ausleihe nicht gefunden");
	}

	const users = await prisma.user.findMany({
		orderBy: { username: "asc" },
	});

	// Only offer items the applicant's lender type (derived from their email) may access.
	const lenderTypeIds = await inferLenderTypeIds(reservation.email);

	const [activePending, changeLogs, availableItems] = await Promise.all([
		getActivePendingChange(reservation.id),
		getChangeLogs(reservation.id),
		prisma.item.findMany({
			where: { itemStatus: "Verfuegbar", ...accessibleItemWhere(lenderTypeIds) },
			select: { id: true, articleName: true, bezeichnung: true, quantity: true },
			orderBy: { articleName: "asc" },
		}),
	]);

	const existingItemIds = new Set(reservation.AusleiheItems.map((ai) => ai.itemId));
	const addableItems = availableItems.filter((i) => !existingItemIds.has(i.id));

	return {
		reservation,
		users,
		activePending,
		changeLogs,
		addableItems,
		isEditable: isStatusEditableForChange(reservation.ausleihStatus),
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const newStatus = formData.get("ausleihStatus") as string;

		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });

		if (!canTransition(reservation.ausleihStatus, newStatus)) {
			return fail(400, { error: `Ungültiger Statuswechsel: ${reservation.ausleihStatus} → ${newStatus}` });
		}

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: newStatus as any },
		});

		return { success: true };
	},

	updatePfand: async ({ request, params }) => {
		const formData = await request.formData();
		const pfandStatus = formData.get("pfandStatus") as string;
		const pfandBetrag = parseInt(formData.get("pfandBetrag") as string) || 0;

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: {
				pfandStatus: pfandStatus as any,
				pfandBetrag,
			},
		});

		return { success: true };
	},

	assignUser: async ({ request, params }) => {
		const formData = await request.formData();
		const field = formData.get("field") as string;
		const userId = formData.get("userId") as string || null;

		const data: any = {};
		if (field === "ausgabe") data.assignedUserAusgabeId = userId;
		if (field === "abholung") data.assignedUserAbholungId = userId;

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data,
		});

		return { success: true };
	},

	markPickedUp: async ({ params }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });

		if (reservation.ausleihStatus !== "Gebucht") {
			return fail(400, { error: "Ausleihe muss im Status 'Bereit zur Abholung' sein." });
		}

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: "ImGange" },
		});

		return { success: true };
	},

	markReadyForPickup: async ({ request, params }) => {
		const formData = await request.formData();
		const abholort = (formData.get("abholort") as string)?.trim();

		if (!abholort) {
			return fail(400, { error: "Bitte gib einen Abholort an." });
		}

		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });

		if (reservation.ausleihStatus !== "Reserviert") {
			return fail(400, { error: "Ausleihe muss im Status 'Reserviert' sein." });
		}

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: "Gebucht", abholort },
		});

		return { success: true };
	},

	approveReservation: async ({ params }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });

		if (reservation.ausleihStatus !== "Verifiziert") {
			return fail(400, { error: "Ausleihe kann nur im Status 'Warten auf Genehmigung' genehmigt werden." });
		}

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: "Reserviert" },
		});

		return { success: true };
	},

	approveItem: async ({ request }) => {
		const formData = await request.formData();
		const itemId = parseInt(formData.get("ausleiheItemId") as string);
		const genehmigt = parseInt(formData.get("genehmigt") as string) || 0;

		await prisma.ausleiheItem.update({
			where: { id: itemId },
			data: { genehmigt },
		});

		return { success: true };
	},

	returnItem: async ({ request }) => {
		const formData = await request.formData();
		const itemId = parseInt(formData.get("ausleiheItemId") as string);
		const zurueckgebracht = parseInt(formData.get("zurueckgebracht") as string) || 0;

		await prisma.ausleiheItem.update({
			where: { id: itemId },
			data: { zurueckgebracht },
		});

		return { success: true };
	},

	updateEmail: async ({ request, params }) => {
		const formData = await request.formData();
		const email = (formData.get("email") as string)?.trim();

		if (!email) {
			return fail(400, { error: "E-Mail darf nicht leer sein." });
		}

		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });

		if (reservation.ausleihStatus !== "Angemeldet") {
			return fail(400, { error: "E-Mail kann nur im Status 'Angemeldet' geändert werden." });
		}

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { email },
		});

		return { success: true };
	},

	markVerified: async ({ params }) => {
		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });

		if (reservation.ausleihStatus !== "Angemeldet") {
			return fail(400, { error: "Nur Ausleihen im Status 'Angemeldet' können verifiziert werden." });
		}

		await prisma.ausleihe.update({
			where: { id: params.r_hash },
			data: { ausleihStatus: "Verifiziert" },
		});

		return { success: true };
	},

	adminEdit: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: "Nicht autorisiert" });

		const reservation = await prisma.ausleihe.findUnique({
			where: { id: params.r_hash },
			include: { AusleiheItems: { include: { item: true } } },
		});

		if (!reservation) return fail(404, { error: "Nicht gefunden" });
		if (!isStatusEditableForChange(reservation.ausleihStatus)) {
			return fail(400, { error: "Diese Ausleihe ist in diesem Status nicht editierbar." });
		}

		const data = await request.formData();

		const newItemIdsRaw = data.getAll("newItemId") as string[];
		const existingItemIds = new Set(reservation.AusleiheItems.map((ai) => ai.itemId));
		const newItemIds = Array.from(
			new Set(newItemIdsRaw.filter((id) => id && !existingItemIds.has(id))),
		);

		let newItemsLookup: Record<
			string,
			{ articleName: string; bezeichnung: string; quantity: number }
		> = {};
		if (newItemIds.length > 0) {
			// Restrict additions to items the applicant's lender type may access; any
			// disallowed id is silently dropped (not present in the lookup below).
			const lenderTypeIds = await inferLenderTypeIds(reservation.email);
			const items = await prisma.item.findMany({
				where: {
					id: { in: newItemIds },
					itemStatus: "Verfuegbar",
					...accessibleItemWhere(lenderTypeIds),
				},
				select: { id: true, articleName: true, bezeichnung: true, quantity: true },
			});
			newItemsLookup = Object.fromEntries(items.map((i) => [i.id, i]));
		}

		const proposed: ProposedSnapshot = {
			scalars: {
				startDate: String(data.get("startDate") ?? reservation.startDate).trim(),
				endDate: String(data.get("endDate") ?? reservation.endDate).trim(),
				verwendungsort: String(data.get("verwendungsort") ?? reservation.verwendungsort).trim(),
				verwendungsStart: String(
					data.get("verwendungsStart") ?? reservation.verwendungsStart,
				).trim(),
				verwendungsEnd: String(data.get("verwendungsEnd") ?? reservation.verwendungsEnd).trim(),
				reason: String(data.get("reason") ?? reservation.reason).trim(),
				phone: String(data.get("phone") ?? reservation.phone).trim(),
			},
			items: reservation.AusleiheItems.map((ai) => {
				const raw = data.get(`item_${ai.id}_beantragt`);
				const parsed = raw !== null ? parseInt(String(raw), 10) : ai.beantragt;
				const newBeantragt = Number.isFinite(parsed) && parsed >= 0 ? parsed : ai.beantragt;
				return {
					ausleiheItemId: ai.id,
					itemId: ai.itemId,
					itemLabel: `${ai.item.articleName} (${ai.item.bezeichnung})`,
					beantragt: newBeantragt,
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
						beantragt,
					};
				})
				.filter((x): x is { itemId: string; itemLabel: string; beantragt: number } => x !== null),
		};

		const adminNote = (data.get("adminNote") as string | null)?.trim() || undefined;
		const previous = buildSnapshotFromAusleihe(reservation);

		const { log, diff, ausleihe } = await applyAdminChange({
			ausleiheId: reservation.id,
			actorName: locals.user.username,
			actorId: locals.user.id,
			previous,
			proposed,
			adminNote,
		});

		if (!log) {
			return fail(400, { error: "Keine Änderungen erkannt." });
		}

		if (ausleihe) {
			try {
				await sendAdminChangeInfoEmail(ausleihe, diff, locals.user.username, adminNote);
			} catch (e) {
				logger.error("Failed to send admin change info email:", e);
			}
		}

		return { success: true };
	},

	addComment: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const content = formData.get("content") as string;
		const hidden = formData.get("hidden") === "on";

		if (!content?.trim()) {
			return fail(400, { error: "Kommentar darf nicht leer sein" });
		}

		await prisma.ausleiheComment.create({
			data: {
				ausleiheId: params.r_hash,
				content: content.trim(),
				author: locals.user?.username || "System",
				login: locals.user?.username || null,
				hidden,
			},
		});

		return { success: true };
	},
};
