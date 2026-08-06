import { z } from 'zod';

export const credentialsSchema = z.object({
	vorname: z.string().min(1, { message: 'Bitte gib deinen Vornamen an.' }),
	nachname: z.string().min(1, { message: 'Bitte gib deinen Nachnamen an.' }),
	email: z.string().email({ message: 'Bitte gib eine gültige E-Mail-Adresse an.' }),
	phone: z.string().optional().default(''),
	reason: z.string().min(1, { message: 'Bitte gib einen Verwendungszweck an.' }),
	verwendungsort: z.string().min(1, { message: 'Bitte gib einen Verwendungsort an.' })
});

export type CredentialsFormData = z.infer<typeof credentialsSchema>;
