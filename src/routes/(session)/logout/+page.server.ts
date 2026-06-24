// routes/+page.server.ts
import { lucia } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/db/prismaConnection';

import type { PageServerLoad } from './$types';

//TODO Falls Prisma in den Querrys nicht funktioniert und die App apstürtzt kann dies genutzt werden, um quasi manuell alle sessions zu beenden
//ob das tatsächlich funktioniert weis ich nicht - die ursache für den fehler ist noch unbekannt
const notfall = false;

export const load: PageServerLoad = async ({ locals, cookies }) => {
	//TODO prisma failsave
	if (notfall) {
		prisma.$disconnect();
	}

	if (!locals.session) {
		// No session, just redirect
		throw redirect(302, '/login');
	}

	try {
		// Invalidate the session if it exists
		await lucia.invalidateSession(locals.session.id);

		// Clear the session cookie
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	} catch (error) {
		console.error('Error during logout:', error);
		// Optionally handle error (but still redirect)
	}

	// Redirect to login regardless
	throw redirect(302, '/login');

};
