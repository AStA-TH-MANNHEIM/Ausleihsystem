<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";

	export let data: any;
	export let form: any;

	let showCreate = false;
	let editLocation: any = null;

	$: locations = data.locations;

	function closeDialogs() {
		showCreate = false;
		editLocation = null;
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
		<h1 class="text-3xl font-bold">Standorte</h1>
		<Button on:click={() => showCreate = true}>+ Neuer Standort</Button>
	</div>

	{#if form?.error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">{form.error}</div>
	{/if}

	<Card.Root>
		<Card.Content class="pt-6">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Standort</Table.Head>
						<Table.Head>Items</Table.Head>
						<Table.Head class="w-[150px]">Aktionen</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each locations as loc (loc.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{loc.standort}</Table.Cell>
							<Table.Cell>{loc._count.Items}</Table.Cell>
							<Table.Cell>
								<div class="flex gap-2">
									<Button variant="ghost" size="sm" on:click={() => editLocation = { ...loc }}>Bearbeiten</Button>
									<form method="POST" action="?/delete" use:enhance={handleEnhance}>
										<input type="hidden" name="id" value={loc.id} />
										<Button type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive">Löschen</Button>
									</form>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if locations.length === 0}
						<Table.Row>
							<Table.Cell colspan={3} class="text-center text-muted-foreground py-8">Keine Standorte vorhanden</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

<Dialog.Root open={showCreate} onOpenChange={(open) => { if (!open) showCreate = false; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Neuer Standort</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={handleEnhance} class="space-y-4">
			<div class="space-y-2">
				<Label for="standort">Standortname</Label>
				<Input id="standort" name="standort" required />
			</div>
			<Dialog.Footer>
				<Button type="submit">Erstellen</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root open={!!editLocation} onOpenChange={(open) => { if (!open) editLocation = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Standort bearbeiten</Dialog.Title>
		</Dialog.Header>
		{#if editLocation}
			<form method="POST" action="?/update" use:enhance={handleEnhance} class="space-y-4">
				<input type="hidden" name="id" value={editLocation.id} />
				<div class="space-y-2">
					<Label>Standortname</Label>
					<Input name="standort" value={editLocation.standort} required />
				</div>
				<Dialog.Footer>
					<Button type="submit">Speichern</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
