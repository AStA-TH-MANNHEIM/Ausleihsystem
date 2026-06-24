import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { logger } from '$lib/logger';

import {
	type AusleiheComment,
} from '$lib/generated/zod/index.js';
import { prisma } from '$lib/server/db/prismaConnection.js';
import { defaultError } from '$lib/server/defaultFail';

const AusleiheCommentInputSchema = z.object({
  ausleiheId: z.string(),
  content: z.string(),
  author: z.string(),  
  login: z.string().optional(),  
  hidden: z.boolean().optional(),     // Prisma sets this default
  timestamp: z.date().optional(),       // Prisma sets this default
});

export async function POST(event) {

	const body = await event.request.json();
	logger.debug(body);

	try {

		if (event.locals.user) {
			body.login = event.locals.user.username;
		}
		const ausleiheComment: AusleiheComment = AusleiheCommentInputSchema.parse(body);

		//logger.debug("ausleiheComment: ", ausleiheComment);

		if(ausleiheComment.author !== 'user') {
			await defaultError(404, 'Invalid data for reserveration');
		}
		//logger.debug("find Ausleihe...");

		const ausleihe = await prisma.ausleihe.findUnique( { where: { id: ausleiheComment.ausleiheId }});

		if(!ausleihe) {
			await defaultError(404, 'Reservation not found');
		}

		const createdComment = await prisma.ausleiheComment.create({ data: ausleiheComment });

		return json({ message: `comment created ${createdComment.id}`});
	} catch (error) {
		console.error('Error handling POST request:', error);
		return json({ message: 'Failed to create comment', error }, { status: 500 });
	}
}
