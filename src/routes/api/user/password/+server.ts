import { redirect } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { logger } from '$lib/logger';
import { lucia } from '$lib/server/auth';
import { prisma } from '$lib/server/db/prismaConnection';
import { UserSchema } from '$lib/generated/zod';
import { hash } from '@node-rs/argon2';
import { generateId } from 'lucia';
import { error } from '@sveltejs/kit';
import { ZodError } from 'zod';
import { flattenZodError } from '$lib/services/flattenZodErrorService';

export async function PUT({ request, locals }) {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const username = locals.user.username;

    logger.debug("CHANGE password");

    logger.debug("request: " ,request);

    try {
        const { password } = await request.json();
        logger.debug("password: " ,password);

        if(!password) {
            error(500, { message: "missing password data" });
        }

        const hashedPassword = await hash(password);
        logger.debug("hashedPassword: " ,hashedPassword);

        const updatedUser = await prisma.user.update({
            where: { username: username },
            data: {
                passwordHash: hashedPassword,
            }
        });

        logger.info('User:updatePassword', username);
        return json({ message: 'Passwort geändert' });
    } catch (e) {
        if (e instanceof ZodError) {
            logger.error("Zod validation failed:", e.flatten());

            error(400, {
                message: flattenZodError(e)
            });
        } else {
            logger.error("Error adding user:", e);
            error(500, { message: e.message });
        }
    }
};
