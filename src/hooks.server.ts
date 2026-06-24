import 'dotenv/config';
import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { logger } from '$lib/logger';

export const handle: Handle = async ({ event, resolve }) => {

	if (
		event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json' ||
		event.url.pathname === '/XXXX'
	) {
		return new Response(null, { status: 204 });
	}

	logger.debug("URL:", event.url.pathname);

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		if(
			event.url.pathname === '/' ||
			event.url.pathname.startsWith('/reservation') ||
			event.url.pathname.startsWith('/login') ||
			event.url.pathname.startsWith('/api/reservation/usercomment') ||
			event.url.pathname.startsWith('/images') ||
			event.url.pathname === '/favicon.ico' ||
			event.url.pathname === '/favicon.png' ||
			event.url.pathname === '/favicon.svg' ||
			event.url.pathname === '/apple-touch-icon.png'
		)
		{
			return resolve(event);
		} else {
			logger.debug("No sessionId, clearing cookie and redirecting to login");
			const sessionCookie = lucia.createBlankSessionCookie();
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
			return new Response(null, {
				status: 302,
				headers: {
					Location: '/login'
				}
			});
		}
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		// Invalid session on a protected route - redirect to login
		if(
			!(event.url.pathname === '/' ||
			event.url.pathname.startsWith('/reservation') ||
			event.url.pathname.startsWith('/login') ||
			event.url.pathname.startsWith('/api/reservation/usercomment') ||
			event.url.pathname.startsWith('/images') ||
			event.url.pathname === '/favicon.ico' ||
			event.url.pathname === '/favicon.png' ||
			event.url.pathname === '/favicon.svg' ||
			event.url.pathname === '/apple-touch-icon.png')
		) {
			logger.debug("Invalid session, redirecting to login");
			return new Response(null, {
				status: 302,
				headers: {
					Location: '/login'
				}
			});
		}
	}
	event.locals.user = user;
	event.locals.session = session;

	logger.debug("URL:", event.url.pathname, "User: ", event.locals.user);

	return resolve(event);
};
