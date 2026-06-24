import type { PageServerLoad, Actions } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
	const lenderTypes = await prisma.lenderType.findMany({
		include: {
			LenderTypePatterns: true,
			_count: { select: { ItemLenderTypes: true } },
		},
		orderBy: { name: "asc" },
	});
	return { lenderTypes };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = (formData.get("name") as string)?.trim();
		const description = (formData.get("description") as string)?.trim() || null;

		if (!name) return fail(400, { error: "Name ist erforderlich." });

		try {
			await prisma.lenderType.create({ data: { name, description } });
		} catch {
			return fail(400, { error: "Ausleihertyp existiert bereits." });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);
		const name = (formData.get("name") as string)?.trim();
		const description = (formData.get("description") as string)?.trim() || null;

		if (!name) return fail(400, { error: "Name ist erforderlich." });

		try {
			await prisma.lenderType.update({ where: { id }, data: { name, description } });
		} catch (e: any) {
			return fail(400, { error: e.message });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);

		try {
			await prisma.lenderType.delete({ where: { id } });
		} catch {
			return fail(400, { error: "Ausleihertyp kann nicht gelöscht werden (noch Items zugewiesen)." });
		}

		return { success: true };
	},

	addPattern: async ({ request }) => {
		const formData = await request.formData();
		const lenderTypeId = parseInt(formData.get("lenderTypeId") as string);
		const pattern = (formData.get("pattern") as string)?.trim();

		if (!pattern) return fail(400, { error: "Pattern ist erforderlich." });

		// Validate regex
		try {
			new RegExp(pattern);
		} catch {
			return fail(400, { error: "Ungültiger regulärer Ausdruck." });
		}

		await prisma.lenderTypePattern.create({ data: { lenderTypeId, pattern } });

		return { success: true };
	},

	removePattern: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("patternId") as string);

		await prisma.lenderTypePattern.delete({ where: { id } });

		return { success: true };
	},
};
