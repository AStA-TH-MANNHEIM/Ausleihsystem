import type { PageServerLoad, Actions } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { fail } from "@sveltejs/kit";
import { hash } from "@node-rs/argon2";
import { v4 as uuidv4 } from "uuid";

export const load: PageServerLoad = async ({ parent }) => {
	const { user: currentUser } = await parent();
	const users = await prisma.user.findMany({
		orderBy: { username: "asc" },
		select: {
			id: true,
			username: true,
			email: true,
			protected: true,
			isAdmin: true,
			createdById: true,
			createdBy: { select: { username: true } },
			_count: {
				select: {
					AusleiheAusgabe: true,
					AusleiheAbholung: true,
				},
			},
		},
	});
	return { users, currentUser };
};

function canManageUser(currentUser: any, targetUser: any): boolean {
	if (currentUser.protected) return true;
	if (currentUser.isAdmin) return true;
	if (targetUser.createdById === currentUser.id) return true;
	return false;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: "Du musst eingeloggt sein." });
		}
		const formData = await request.formData();
		const username = (formData.get("username") as string)?.trim();
		const email = (formData.get("email") as string)?.trim();
		const password = formData.get("password") as string;

		if (!username || !email || !password) {
			return fail(400, { error: "Alle Felder sind Pflicht." });
		}
		if (password.length < 6) {
			return fail(400, { error: "Passwort muss mindestens 6 Zeichen haben." });
		}

		try {
			const passwordHash = await hash(password);
			await prisma.user.create({
				data: { id: uuidv4(), username, email, passwordHash, createdById: locals.user.id },
			});
		} catch {
			return fail(400, { error: "Benutzername oder E-Mail existiert bereits." });
		}

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: "Du musst eingeloggt sein." });
		}
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const username = (formData.get("username") as string)?.trim();
		const email = (formData.get("email") as string)?.trim();
		const isAdmin = formData.get("isAdmin") === "on";

		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) return fail(404, { error: "Benutzer nicht gefunden." });

		const currentUser = await prisma.user.findUnique({ where: { id: locals.user.id } });
		if (!currentUser || !canManageUser(currentUser, targetUser)) {
			return fail(403, { error: "Keine Berechtigung diesen Benutzer zu bearbeiten." });
		}

		if (targetUser.protected && !currentUser.protected) {
			return fail(403, { error: "Geschützte Benutzer können nur vom Initial-Admin bearbeitet werden." });
		}

		if (!username || !email) {
			return fail(400, { error: "Benutzername und E-Mail sind Pflicht." });
		}

		// Admins can grant/revoke admin rights
		const data: any = { username, email };
		if (currentUser.protected || currentUser.isAdmin) {
			data.isAdmin = isAdmin;
		}

		try {
			await prisma.user.update({ where: { id }, data });
		} catch {
			return fail(400, { error: "Benutzername oder E-Mail existiert bereits." });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: "Du musst eingeloggt sein." });
		}
		const formData = await request.formData();
		const id = formData.get("id") as string;

		if (id === locals.user.id) {
			return fail(400, { error: "Du kannst dich nicht selbst löschen." });
		}

		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) return fail(404, { error: "Benutzer nicht gefunden." });

		if (targetUser.protected) {
			return fail(400, { error: "Geschützte Benutzer können nicht gelöscht werden." });
		}

		const currentUser = await prisma.user.findUnique({ where: { id: locals.user.id } });
		if (!currentUser || !canManageUser(currentUser, targetUser)) {
			return fail(403, { error: "Keine Berechtigung diesen Benutzer zu löschen." });
		}

		try {
			await prisma.user.delete({ where: { id } });
		} catch {
			return fail(400, { error: "Benutzer kann nicht gelöscht werden." });
		}

		return { success: true };
	},

	resetPassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: "Du musst eingeloggt sein." });
		}
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const password = formData.get("password") as string;

		if (!password || password.length < 6) {
			return fail(400, { error: "Passwort muss mindestens 6 Zeichen haben." });
		}

		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) return fail(404, { error: "Benutzer nicht gefunden." });

		const currentUser = await prisma.user.findUnique({ where: { id: locals.user.id } });
		if (!currentUser || !canManageUser(currentUser, targetUser)) {
			return fail(403, { error: "Keine Berechtigung das Passwort zu ändern." });
		}

		const passwordHash = await hash(password);
		await prisma.user.update({
			where: { id },
			data: { passwordHash },
		});

		return { success: true };
	},
};
