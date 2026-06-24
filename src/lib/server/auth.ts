// src/lib/server/auth.ts
import { Lucia, TimeSpan } from 'lucia';
import { dev } from '$app/environment';

// Prisma
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

const prismaAdapter = new PrismaAdapter(client.session, client.user);

export const lucia = new Lucia(prismaAdapter, {
	sessionExpiresIn: new TimeSpan(1, 'd'), // 2 weeks
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			protected: attributes.protected,
			isAdmin: attributes.isAdmin
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	protected: boolean;
	isAdmin: boolean;
}
