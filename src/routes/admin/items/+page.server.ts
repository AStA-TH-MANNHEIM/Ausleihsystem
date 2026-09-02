import type { PageServerLoad, Actions } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { fail } from "@sveltejs/kit";
import {
	creatorFields,
	logItemCreated,
	logItemDeleted,
	logItemUpdated,
} from "$lib/server/itemChangeLogService";

export const load: PageServerLoad = async () => {
	const [items, locations, tags, lenderTypes] = await Promise.all([
		prisma.item.findMany({
			include: {
				Standort: true,
				ItemTags: { include: { tag: true } },
				ItemLenderTypes: { include: { lenderType: true } },
				ItemComponents: true,
			},
			orderBy: { id: "desc" },
		}),
		prisma.standort.findMany({ orderBy: { standort: "asc" } }),
		prisma.tag.findMany({ orderBy: { name: "asc" } }),
		prisma.lenderType.findMany({ orderBy: { name: "asc" } }),
	]);

	return { items, locations, tags, lenderTypes };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const articleName = formData.get("articleName") as string;
		const bezeichnung = formData.get("bezeichnung") as string;
		const quantity = parseInt(formData.get("quantity") as string) || 1;
		const defectQuantity = parseInt(formData.get("defectQuantity") as string) || 0;
		const itemStatus = (formData.get("itemStatus") as string) || "Verfuegbar";
		const rawStandortId = formData.get("standortId") as string;
		const standortId = rawStandortId ? parseInt(rawStandortId) : undefined;
		const description = (formData.get("description") as string) || "";
		const kaufdatumRaw = formData.get("kaufdatum") as string;
		const kaufdatum = kaufdatumRaw ? new Date(kaufdatumRaw) : null;
		const kaufpreisRaw = formData.get("kaufpreis") as string;
		const kaufpreis = kaufpreisRaw ? parseInt(kaufpreisRaw) || 0 : 0;
		const tagIds = (formData.getAll("tagIds") as string[]).map((id) => parseInt(id));
		const lenderTypeIds = (formData.getAll("lenderTypeIds") as string[]).map((id) => parseInt(id));
		const componentNames = formData.getAll("componentName") as string[];
		const componentDescriptions = formData.getAll("componentDescription") as string[];
		const componentQuantities = formData.getAll("componentQuantity") as string[];
		const components = componentNames
			.map((name, i) => ({
				name: name.trim(),
				description: (componentDescriptions[i] || "").trim(),
				quantity: parseInt(componentQuantities[i]) || 1,
			}))
			.filter((c) => c.name.length > 0);

		if (!id || !articleName || !bezeichnung) {
			return fail(400, { error: "ID, Artikelname und Bezeichnung sind Pflichtfelder." });
		}
		if (defectQuantity > quantity) {
			return fail(400, { error: "Defekte Menge kann nicht größer als Gesamtmenge sein." });
		}

		try {
			const data: any = {
				id,
				articleName,
				bezeichnung,
				kaufdatum,
				kaufpreis,
				quantity,
				defectQuantity,
				itemStatus,
				description,
				...creatorFields(locals.user),
			};
			if (standortId) data.standortId = standortId;
			if (tagIds.length > 0) data.ItemTags = { create: tagIds.map((tagId) => ({ tagId })) };
			if (lenderTypeIds.length > 0) data.ItemLenderTypes = { create: lenderTypeIds.map((lenderTypeId) => ({ lenderTypeId })) };
			if (components.length > 0) data.ItemComponents = { create: components };

			await prisma.item.create({ data });
			await logItemCreated({ ...data, standortId: standortId ?? null }, locals.user);
		} catch (e: any) {
			return fail(400, { error: e.message });
		}

		return { success: true };
	},

	update: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const articleName = formData.get("articleName") as string;
		const bezeichnung = formData.get("bezeichnung") as string;
		const quantity = parseInt(formData.get("quantity") as string) || 1;
		const defectQuantity = parseInt(formData.get("defectQuantity") as string) || 0;
		const itemStatus = formData.get("itemStatus") as string;
		const rawStandortId = formData.get("standortId") as string;
		const standortId = rawStandortId ? parseInt(rawStandortId) : null;
		const description = (formData.get("description") as string) || "";
		const kaufdatumRaw = formData.get("kaufdatum") as string;
		const kaufdatum = kaufdatumRaw ? new Date(kaufdatumRaw) : null;
		const kaufpreisRaw = formData.get("kaufpreis") as string;
		const kaufpreis = kaufpreisRaw ? parseInt(kaufpreisRaw) || 0 : 0;
		const tagIds = (formData.getAll("tagIds") as string[]).map((id) => parseInt(id));
		const lenderTypeIds = (formData.getAll("lenderTypeIds") as string[]).map((id) => parseInt(id));
		const componentNames = formData.getAll("componentName") as string[];
		const componentDescriptions = formData.getAll("componentDescription") as string[];
		const componentQuantities = formData.getAll("componentQuantity") as string[];
		const components = componentNames
			.map((name, i) => ({
				name: name.trim(),
				description: (componentDescriptions[i] || "").trim(),
				quantity: parseInt(componentQuantities[i]) || 1,
			}))
			.filter((c) => c.name.length > 0);

		if (defectQuantity > quantity) {
			return fail(400, { error: "Defekte Menge kann nicht größer als Gesamtmenge sein." });
		}

		try {
			const before = await prisma.item.findUnique({ where: { id } });

			await (prisma.item.update as any)({
				where: { id },
				data: {
					articleName,
					bezeichnung,
					kaufdatum,
					kaufpreis,
					quantity,
					defectQuantity,
					itemStatus,
					standortId,
					description,
					ItemTags: {
						deleteMany: {},
						create: tagIds.map((tagId) => ({ tagId })),
					},
					ItemLenderTypes: {
						deleteMany: {},
						create: lenderTypeIds.map((lenderTypeId) => ({ lenderTypeId })),
					},
					ItemComponents: {
						deleteMany: {},
						create: components,
					},
				},
			});

			if (before) {
				await logItemUpdated(
					before,
					{
						articleName,
						bezeichnung,
						kaufdatum,
						kaufpreis,
						quantity,
						defectQuantity,
						itemStatus,
						standortId,
						description,
					},
					locals.user,
				);
			}
		} catch (e: any) {
			return fail(400, { error: e.message });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;

		try {
			const before = await prisma.item.findUnique({ where: { id } });

			await prisma.item.delete({ where: { id } });

			if (before) {
				await logItemDeleted(before, locals.user);
			}
		} catch (e: any) {
			return fail(400, { error: e.message });
		}

		return { success: true };
	},
};
