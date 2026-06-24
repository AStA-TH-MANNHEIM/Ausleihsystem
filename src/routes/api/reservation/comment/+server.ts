import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { logger } from '$lib/logger';

import {
	type AusleiheComment,
} from '$lib/generated/zod/index.js';
import { prisma } from '$lib/server/db/prismaConnection.js';

const AusleiheCommentInputSchema = z.object({
  ausleiheId: z.string(),
  content: z.string(),
  author: z.string(),  
  login: z.string(),  
  hidden: z.boolean().optional(),     // Prisma sets this default
  timestamp: z.date().optional(),       // Prisma sets this default
});

export async function POST(event) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized: You must be logged in to access this resource.');
	}

	const body = await event.request.json();

	body.login = event.locals.user.username;
	logger.debug("body+user: ", body);

	try {
		const ausleiheComment: AusleiheComment = AusleiheCommentInputSchema.parse(body);

		logger.debug("ausleiheComment: ", ausleiheComment);

		const createdComment = await prisma.ausleiheComment.create({ data: ausleiheComment });

		return json({ message: `comment created ${createdComment.id}`});
	} catch (error) {
		console.error('Error handling POST request:', error);
		return json({ message: 'Failed to create comment', error }, { status: 500 });
	}
}
