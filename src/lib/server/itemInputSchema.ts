import { ItemSchema } from '$lib/generated/zod';

/**
 * Vom Client akzeptierte Item-Felder.
 * Bewusst ohne die Audit-Felder (createdAt/createdById/createdByName) - diese werden
 * ausschliesslich serverseitig aus der Session gesetzt und nie aus dem Request uebernommen.
 */
export const ItemInputSchema = ItemSchema.pick({
	id: true,
	articleName: true,
	bezeichnung: true,
	kaufdatum: true,
	kaufpreis: true,
	description: true,
	quantity: true,
	defectQuantity: true,
	itemStatus: true,
	standortId: true
});

export type ItemInput = typeof ItemInputSchema._output;
