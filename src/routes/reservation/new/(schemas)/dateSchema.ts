import { z } from 'zod';

function getTodayDate(): string {
	return new Date().toISOString().split('T')[0];
}

function getMinStartDate(): string {
	const d = new Date();
	d.setDate(d.getDate() + 14);
	return d.toISOString().split('T')[0];
}

export const dateSchema = z
	.object({
		startDate: z.string().min(1, { message: 'Bitte wähle ein Startdatum.' }),
		endDate: z.string().min(1, { message: 'Bitte wähle ein Enddatum.' }),
		verwendungsStart: z.string().optional().default(''),
		verwendungsEnd: z.string().optional().default('')
	})
	.refine((data) => data.startDate >= getTodayDate(), {
		message: 'Das Startdatum darf nicht in der Vergangenheit liegen.',
		path: ['startDate']
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: 'Das Enddatum darf nicht vor dem Startdatum liegen.',
		path: ['endDate']
	})
	.refine((data) => !data.verwendungsStart || !data.verwendungsEnd || data.verwendungsEnd >= data.verwendungsStart, {
		message: 'Das Verwendungsende darf nicht vor dem Verwendungsstart liegen.',
		path: ['verwendungsEnd']
	})
	.refine((data) => !data.verwendungsStart || data.verwendungsStart >= data.startDate, {
		message: 'Der Verwendungsstart darf nicht vor dem Ausleihstart liegen.',
		path: ['verwendungsStart']
	})
	.refine((data) => !data.verwendungsEnd || data.verwendungsEnd <= data.endDate, {
		message: 'Das Verwendungsende darf nicht nach dem Ausleihenddatum liegen.',
		path: ['verwendungsEnd']
	});

export type DateFormData = z.infer<typeof dateSchema>;
export { getTodayDate, getMinStartDate };
