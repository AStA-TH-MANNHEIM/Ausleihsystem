import { redirect } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { logger } from '$lib/logger';
import { lucia } from '$lib/server/auth';
import { verify } from '@node-rs/argon2';
import { prisma } from '$lib/server/db/prismaConnection';
import { UserSchema } from '$lib/generated/zod';
import { hash } from '@node-rs/argon2';
import { generateId } from 'lucia';
import { error } from '@sveltejs/kit';
import { ZodError } from 'zod';
import { flattenZodError } from '$lib/services/flattenZodErrorService';

export async function DELETE({ request, locals }) {

    if (!locals.user) {
        redirect(302, '/login');
    }

    // logger.debug("DELETE User");

    try {

        const { id } = await request.json();
        logger.debug("DELETE User, id:", id);

        await lucia.invalidateUserSessions(id);
        await prisma.user.delete({ where: { id: id, protected: false } });

        console.log('User:delete', id, 'von Nutzer', locals.user);

        return json({ message: 'Nutzer gelöscht' });
    } catch (e) {
        console.log(e);
        error(400, { message: e.message });
    }
};

export async function POST({ request, locals }) {
    if (!locals.user) {
        redirect(302, '/login');
    }

    logger.debug("ADD User");

    // logger.debug("request: " ,request);

    try {
        const { username, email, password } = await request.json();

        UserSchema.pick({
            username: true,
            email: true
        }).parse({ username, email });

        const hashedPassword = await hash(password);
        logger.debug("hashedPassword: " ,hashedPassword);

        const newUser = await prisma.user.create({
            data: {
                id: generateId(10),
                username: username,
                email: email,
                passwordHash: hashedPassword
            }
        });
        console.log('User:add', newUser, 'von Nutzer', locals.user);
        return json({ message: 'Nutzer erstellt' });
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


export async function PUT({ request, locals }) {
    if (!locals.user) {
        redirect(302, '/login');
    }

    logger.debug("UPDATE User");

    // logger.debug("request: " ,request);

    try {
        const user = await request.json();
        logger.debug("user:", user);


        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.email,
            }
        });
        console.log('User:update', updatedUser, 'von Nutzer', user.id);
        return json({ message: 'Nutzer geändert' });
    } catch (e) {
        if (e instanceof ZodError) {
            logger.error("Zod validation failed:", e.flatten());

            error(400, {
                message: flattenZodError(e)
            });
        } else {
            logger.error("Error updating user:", e);
            error(500, { message: e.message });
        }
    }
};

