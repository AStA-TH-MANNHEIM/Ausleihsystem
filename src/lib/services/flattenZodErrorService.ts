import { ZodError } from 'zod';

export function flattenZodError(error: ZodError): string {
	const flat = error.flatten();

	const fieldMessages = Object.entries(flat.fieldErrors).flatMap(
		([field, messages]) =>
			messages?.map((msg) => `${field}: ${msg}`) ?? []
	);

	const formMessages = flat.formErrors;

	return [...formMessages, ...fieldMessages].join();
}