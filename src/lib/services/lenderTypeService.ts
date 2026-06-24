import { prisma } from '$lib/server/db/prismaConnection';

export async function inferLenderTypes(email: string) {
	const allTypes = await prisma.lenderType.findMany({
		include: { LenderTypePatterns: true },
	});

	return allTypes.filter((lt) =>
		lt.LenderTypePatterns.some((p) => {
			try {
				return new RegExp(p.pattern).test(email);
			} catch {
				return false;
			}
		})
	);
}

export async function canAccessItem(email: string, itemLenderTypeIds: number[]): Promise<boolean> {
	if (itemLenderTypeIds.length === 0) return true; // no restriction
	const userTypes = await inferLenderTypes(email);
	return userTypes.some((lt) => itemLenderTypeIds.includes(lt.id));
}

/** Ids of all lender types whose email patterns match the given email. */
export async function inferLenderTypeIds(email: string): Promise<number[]> {
	const types = await inferLenderTypes(email);
	return types.map((lt) => lt.id);
}

/**
 * Prisma `Item` where-fragment selecting only items the given lender types may
 * access: items with no LenderType restriction, plus items restricted to one of
 * the provided lender type ids. Mirrors the filtering on the request page.
 */
export function accessibleItemWhere(lenderTypeIds: number[]) {
	return {
		OR: [
			{ ItemLenderTypes: { none: {} } },
			...(lenderTypeIds.length
				? [{ ItemLenderTypes: { some: { lenderTypeId: { in: lenderTypeIds } } } }]
				: [])
		]
	};
}
