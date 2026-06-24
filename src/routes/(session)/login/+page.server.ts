// routes/login/+page.server.ts
import { lucia } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { prisma } from '$lib/server/db/prismaConnection';
import type { Actions } from './$types';
import { logger } from '$lib/logger';
import { defaultFail } from '$lib/server/defaultFail';


async function myFail() {
	return await defaultFail(404, 'invalid username or password');
}

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (
			typeof username !== 'string' ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-zA-Z0-9_-]+$/.test(username)
		) {
			logger.debug('Login:invalidUsername', username);
			return await myFail();
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			logger.debug('Login:invalidPassword', username);
			return await myFail();
		}

		const existingUser = await prisma.user.findFirst({
			where: {
				username: {
					equals: username
				}
			}
		});

		if (!existingUser) {
			logger.debug('Login:wrongUsername', username);
			return await myFail();
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			logger.debug('Login:wrongPassword', username);
			return await myFail();
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		console.log('Login:success', username, 'id:', existingUser.id);

		redirect(302, '/admin');
	}
};
