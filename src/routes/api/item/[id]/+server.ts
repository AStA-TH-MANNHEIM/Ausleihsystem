import {type Item, ItemSchema } from '$lib/generated/zod';
import { prisma } from '$lib/server/db/prismaConnection';
import { error, json } from '@sveltejs/kit';

const idSchema = ItemSchema.pick({ id: true });

export async function GET(event) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized: You must be logged in to access this resource.');
	}

	try {
		const id = event.params.id;
		idSchema.parse({ id: id });

		const item = await prisma.item.findUnique({
			where: {
				id: id
			}
		});

		if (!item) {
			throw error(404, 'Item nicht gefunden');
		} else {
			return json({ item: item }, { status: 200 });
		}
	} catch (err: any) {
		throw error(500, err.message);
	}
}

export async function PUT(event) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized: You must be logged in to access this resource.');
	}

	try {
		const id = idSchema.parse({ id: event.params.id }).id;
		const body = await event.request.json();
		const item: Item = ItemSchema.parse(body);

		const dbItem = await prisma.item.findUnique({
			where: {
				id: id
			}
		});

		if (!dbItem) {
			throw error(404, 'Item nicht gefunden');
		}

		if (id !== item.id) {
			throw error(
				400,
				'Ids stimmen nicht überein. Änderungen an der ID sollten nur durch einen Admin erfolgen'
			);
		}

		await prisma.item.update({
			where: {
				id: id
			},
			data: item
		});

		console.log('Item:update', dbItem, 'to', item, ' by', event.locals.user);

		return json({ message: 'Item in der Datenbank gespeichert.' }, { status: 200 });
	} catch (err: any) {
		throw error(500, err.message);
	}
}
