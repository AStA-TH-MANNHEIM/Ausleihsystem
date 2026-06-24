import type { PageServerLoad, Actions } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
	const tags = await prisma.tag.findMany({
		include: { _count: { select: { ItemTags: true } } },
		orderBy: { name: "asc" },
	});
	return { tags };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = (formData.get("name") as string)?.trim();
		const description = (formData.get("description") as string)?.trim() || null;

		if (!name) return fail(400, { error: "Tagname ist erforderlich." });

		try {
			await prisma.tag.create({ data: { name, description } });
		} catch {
			return fail(400, { error: "Tag existiert bereits." });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);
		const name = (formData.get("name") as string)?.trim();
		const description = (formData.get("description") as string)?.trim() || null;

		if (!name) return fail(400, { error: "Tagname ist erforderlich." });

		try {
			await prisma.tag.update({ where: { id }, data: { name, description } });
		} catch (e: any) {
			return fail(400, { error: e.message });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);

		try {
			await prisma.tag.delete({ where: { id } });
		} catch {
			return fail(400, { error: "Tag kann nicht gelöscht werden." });
		}

		return { success: true };
	},
};
