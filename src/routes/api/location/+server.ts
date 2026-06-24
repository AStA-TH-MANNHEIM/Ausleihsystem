import { Standort } from '$lib/generated/zod';
import { prisma } from '$lib/server/db/prismaConnection';
import { error, json } from '@sveltejs/kit';

export async function GET(event) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized: You must be logged in to access this resource.');
	}

	try {
		const standorte: Standort[] = await prisma.standort.findMany();
		return json({ standorte });
	} catch (err: unknown){
		let message = 'Fehler beim Abrufen der Standorte';
		if (err instanceof Error) {
			message = `Fehler beim Abrufen der Standorte: ${err.message}`;
		}
		throw error(500, message);
	}
}
