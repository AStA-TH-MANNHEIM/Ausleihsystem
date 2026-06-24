import type { PageServerLoad, Actions } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
	const locations = await prisma.standort.findMany({
		include: { _count: { select: { Items: true } } },
		orderBy: { standort: "asc" },
	});
	return { locations };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const standort = (formData.get("standort") as string)?.trim();

		if (!standort) return fail(400, { error: "Standortname ist erforderlich." });

		try {
			await prisma.standort.create({ data: { standort } });
		} catch (e: any) {
			return fail(400, { error: "Standort existiert bereits." });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);
		const standort = (formData.get("standort") as string)?.trim();

		if (!standort) return fail(400, { error: "Standortname ist erforderlich." });

		try {
			await prisma.standort.update({ where: { id }, data: { standort } });
		} catch (e: any) {
			return fail(400, { error: e.message });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);

		try {
			await prisma.standort.delete({ where: { id } });
		} catch (e: any) {
			return fail(400, { error: "Standort kann nicht gelöscht werden (noch Items zugewiesen)." });
		}

		return { success: true };
	},
};
