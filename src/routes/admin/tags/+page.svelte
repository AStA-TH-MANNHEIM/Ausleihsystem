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

	export let data: any;
	export let form: any;

	let showCreate = false;
	let editTag: any = null;

	$: tags = data.tags;

	function closeDialogs() {
		showCreate = false;
		editTag = null;
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
		<h1 class="text-3xl font-bold">Tags</h1>
		<Button on:click={() => showCreate = true}>+ Neuer Tag</Button>
	</div>

	{#if form?.error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">{form.error}</div>
	{/if}

	<Card.Root>
		<Card.Content class="pt-6">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Tag</Table.Head>
						<Table.Head>Beschreibung</Table.Head>
						<Table.Head>Items</Table.Head>
						<Table.Head class="w-[150px]">Aktionen</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each tags as tag (tag.id)}
						<Table.Row>
							<Table.Cell>
								<Badge variant="secondary">{tag.name}</Badge>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">{tag.description || "—"}</Table.Cell>
							<Table.Cell>{tag._count.ItemTags}</Table.Cell>
							<Table.Cell>
								<div class="flex gap-2">
									<Button variant="ghost" size="sm" on:click={() => editTag = { ...tag }}>Bearbeiten</Button>
									<form method="POST" action="?/delete" use:enhance={handleEnhance}>
										<input type="hidden" name="id" value={tag.id} />
										<Button type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive">Löschen</Button>
									</form>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if tags.length === 0}
						<Table.Row>
							<Table.Cell colspan={4} class="text-center text-muted-foreground py-8">Keine Tags vorhanden</Table.Cell>
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
			<Dialog.Title>Neuer Tag</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={handleEnhance} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Tagname</Label>
				<Input id="name" name="name" required />
			</div>
			<div class="space-y-2">
				<Label for="description">Beschreibung</Label>
				<Input id="description" name="description" />
			</div>
			<Dialog.Footer>
				<Button type="submit">Erstellen</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root open={!!editTag} onOpenChange={(open) => { if (!open) editTag = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Tag bearbeiten</Dialog.Title>
		</Dialog.Header>
		{#if editTag}
			<form method="POST" action="?/update" use:enhance={handleEnhance} class="space-y-4">
				<input type="hidden" name="id" value={editTag.id} />
				<div class="space-y-2">
					<Label>Tagname</Label>
					<Input name="name" value={editTag.name} required />
				</div>
				<div class="space-y-2">
					<Label>Beschreibung</Label>
					<Input name="description" value={editTag.description || ""} />
				</div>
				<Dialog.Footer>
					<Button type="submit">Speichern</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
