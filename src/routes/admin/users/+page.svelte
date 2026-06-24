<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Badge } from "$lib/components/ui/badge";
	import { Separator } from "$lib/components/ui/separator";

	export let data: any;
	export let form: any;

	let showCreate = false;
	let editUser: any = null;
	let resetPasswordUser: any = null;
	let deleteConfirmUser: any = null;

	$: users = data.users;
	$: currentUser = data.currentUser;

	function hasAdminRole(user: any): boolean {
		return user.protected || user.isAdmin;
	}

	function canManage(targetUser: any): boolean {
		if (!currentUser) return false;
		if (hasAdminRole(currentUser)) return true;
		if (targetUser.createdById === currentUser.id) return true;
		return false;
	}

	function closeDialogs() {
		showCreate = false;
		editUser = null;
		resetPasswordUser = null;
		deleteConfirmUser = null;
	}

	function handleEnhance() {
		return async ({ result }: any) => {
			if (result.type === "success") {
				closeDialogs();
				await invalidateAll();
			}
		};
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Benutzer</h1>
		<Button on:click={() => showCreate = true}>+ Neuer Benutzer</Button>
	</div>

	{#if form?.error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">{form.error}</div>
	{/if}

	<Card.Root>
		<Card.Content class="pt-6">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Benutzername</Table.Head>
						<Table.Head>E-Mail</Table.Head>
						<Table.Head>Erstellt von</Table.Head>
						<Table.Head>Zuweisungen</Table.Head>
						<Table.Head>Rolle</Table.Head>
						<Table.Head class="w-[250px]">Aktionen</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each users as user (user.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{user.username}</Table.Cell>
							<Table.Cell>{user.email}</Table.Cell>
							<Table.Cell>
								<span class="text-sm text-muted-foreground">
									{user.createdBy?.username || "—"}
								</span>
							</Table.Cell>
							<Table.Cell>
								<span class="text-sm text-muted-foreground">
									{user._count.AusleiheAusgabe + user._count.AusleiheAbholung} Ausleihen
								</span>
							</Table.Cell>
							<Table.Cell>
								{#if hasAdminRole(user)}
									<Badge>Admin</Badge>
								{:else}
									<Badge variant="outline">Benutzer</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if canManage(user)}
									<div class="flex gap-2">
										<Button variant="ghost" size="sm" on:click={() => editUser = { ...user }}>
											Bearbeiten
										</Button>
										<Button variant="ghost" size="sm" on:click={() => resetPasswordUser = user}>
											Passwort
										</Button>
										{#if !user.protected && user.id !== currentUser?.id}
											<Button
												variant="ghost"
												size="sm"
												class="text-destructive hover:text-destructive"
												on:click={() => deleteConfirmUser = user}
											>
												Löschen
											</Button>
										{/if}
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if users.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="text-center text-muted-foreground py-8">Keine Benutzer vorhanden</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

<!-- Create Dialog -->
<Dialog.Root open={showCreate} onOpenChange={(open) => { if (!open) showCreate = false; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Neuer Benutzer</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={handleEnhance} class="space-y-4">
			<div class="space-y-2">
				<Label for="username">Benutzername</Label>
				<Input id="username" name="username" required />
			</div>
			<div class="space-y-2">
				<Label for="email">E-Mail</Label>
				<Input id="email" name="email" type="email" required />
			</div>
			<div class="space-y-2">
				<Label for="password">Passwort</Label>
				<Input id="password" name="password" type="password" required minlength={6} />
			</div>
			<Dialog.Footer>
				<Button type="submit">Erstellen</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root open={!!editUser} onOpenChange={(open) => { if (!open) editUser = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Benutzer bearbeiten</Dialog.Title>
		</Dialog.Header>
		{#if editUser}
			<form method="POST" action="?/update" use:enhance={handleEnhance} class="space-y-4">
				<input type="hidden" name="id" value={editUser.id} />
				<div class="space-y-2">
					<Label for="edit-username">Benutzername</Label>
					<Input id="edit-username" name="username" value={editUser.username} required />
				</div>
				<div class="space-y-2">
					<Label for="edit-email">E-Mail</Label>
					<Input id="edit-email" name="email" type="email" value={editUser.email} required />
				</div>
				{#if currentUser?.protected || currentUser?.isAdmin}
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-isAdmin"
							name="isAdmin"
							checked={editUser.isAdmin}
							class="rounded"
						/>
						<Label for="edit-isAdmin">Admin-Rechte</Label>
					</div>
				{/if}
				<Dialog.Footer>
					<Button type="submit">Speichern</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Reset Password Dialog -->
<Dialog.Root open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) resetPasswordUser = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Passwort zurücksetzen</Dialog.Title>
			{#if resetPasswordUser}
				<p class="text-sm text-muted-foreground">Für: {resetPasswordUser.username}</p>
			{/if}
		</Dialog.Header>
		{#if resetPasswordUser}
			<form method="POST" action="?/resetPassword" use:enhance={handleEnhance} class="space-y-4">
				<input type="hidden" name="id" value={resetPasswordUser.id} />
				<div class="space-y-2">
					<Label>Neues Passwort</Label>
					<Input name="password" type="password" required minlength={6} />
				</div>
				<Dialog.Footer>
					<Button type="submit">Passwort setzen</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root open={!!deleteConfirmUser} onOpenChange={(open) => { if (!open) deleteConfirmUser = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Benutzer löschen</Dialog.Title>
		</Dialog.Header>
		{#if deleteConfirmUser}
			<p class="text-sm text-muted-foreground">
				Bist du sicher, dass du <strong>{deleteConfirmUser.username}</strong> löschen möchtest?
			</p>
			<form method="POST" action="?/delete" use:enhance={handleEnhance}>
				<input type="hidden" name="id" value={deleteConfirmUser.id} />
				<Dialog.Footer class="mt-4">
					<Button variant="outline" type="button" on:click={() => deleteConfirmUser = null}>Abbrechen</Button>
					<Button type="submit" variant="destructive">Löschen</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
