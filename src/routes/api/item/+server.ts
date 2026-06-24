import {type Item, ItemSchema } from '$lib/generated/zod';
import { prisma } from '$lib/server/db/prismaConnection';
import { error, json } from '@sveltejs/kit';

export async function POST(event) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized: You must be logged in to access this resource.');
	}

	const body = await event.request.json();
	console.log(body);

	try {
		const item: Item = ItemSchema.parse(body);

		const existingItem = await prisma.item.findUnique({
			where: {
				id: item.id
			}
		});

		if (existingItem) {
			return json({ message: 'Id bereits vorhanden.' }, { status: 400 });
		}

		await prisma.item.create({ data: item });

		console.log('Item:add', item, ' by', event.locals.user);

		return json({ message: 'Item in der Datenbank hinzugefügt.' }, { status: 200 });
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw error(500, err.message);
		} else {
			throw error(500, 'Unbekannter Fehler beim Speichern');
		}
	}
}
