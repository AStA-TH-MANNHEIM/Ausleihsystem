<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Badge } from "$lib/components/ui/badge";
	import { Separator } from "$lib/components/ui/separator";

	export let data: any;
	export let form: any;

	let showCreate = false;
	let editType: any = null;
	let newPattern = "";

	$: lenderTypes = data.lenderTypes;

	function closeDialogs() {
		showCreate = false;
		editType = null;
		newPattern = "";
	}

	function handleEnhance() {
		return async ({ result }: any) => {
			if (result.type === "success") {
				closeDialogs();
				await invalidateAll();
			}
		};
	}

	function handlePatternEnhance() {
		return async ({ result }: any) => {
			if (result.type === "success") {
				newPattern = "";
				await invalidateAll();
				// Re-fetch the editType with updated patterns
				const updated = data.lenderTypes.find((lt: any) => lt.id === editType?.id);
				if (updated) editType = { ...updated };
			}
		};
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Ausleihertypen</h1>
		<Button on:click={() => showCreate = true}>+ Neuer Typ</Button>
	</div>

	{#if form?.error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">{form.error}</div>
	{/if}

	<Card.Root>
		<Card.Content class="pt-6">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Beschreibung</Table.Head>
						<Table.Head>E-Mail-Muster</Table.Head>
						<Table.Head>Items</Table.Head>
						<Table.Head class="w-[100px]">Aktionen</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each lenderTypes as lt (lt.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{lt.name}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{lt.description || "—"}</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1">
									{#each lt.LenderTypePatterns as p}
										<Badge variant="secondary" class="text-xs font-mono">{p.pattern}</Badge>
									{/each}
									{#if lt.LenderTypePatterns.length === 0}
										<span class="text-muted-foreground text-xs">Keine Muster</span>
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell>{lt._count.ItemLenderTypes}</Table.Cell>
							<Table.Cell>
								<Button variant="ghost" size="sm" on:click={() => editType = { ...lt }}>
									Bearbeiten
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if lenderTypes.length === 0}
						<Table.Row>
							<Table.Cell colspan={5} class="text-center text-muted-foreground py-8">Keine Ausleihertypen vorhanden</Table.Cell>
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
			<Dialog.Title>Neuer Ausleihertyp</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={handleEnhance} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Name</Label>
				<Input id="name" name="name" required />
			</div>
			<div class="space-y-2">
				<Label for="description">Beschreibung</Label>
				<Textarea id="description" name="description" />
			</div>
			<Dialog.Footer>
				<Button type="submit">Erstellen</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root open={!!editType} onOpenChange={(open) => { if (!open) editType = null; }}>
	<Dialog.Content class="max-w-lg max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Ausleihertyp bearbeiten</Dialog.Title>
		</Dialog.Header>
		{#if editType}
			<form method="POST" action="?/update" use:enhance={handleEnhance} class="space-y-4">
				<input type="hidden" name="id" value={editType.id} />
				<div class="space-y-2">
					<Label for="edit-name">Name</Label>
					<Input id="edit-name" name="name" value={editType.name} required />
				</div>
				<div class="space-y-2">
					<Label for="edit-description">Beschreibung</Label>
					<Textarea id="edit-description" name="description" value={editType.description || ""} />
				</div>
				<Dialog.Footer>
					<Button type="submit">Speichern</Button>
				</Dialog.Footer>
			</form>

			<Separator class="my-4" />

			<!-- Patterns Section -->
			<div class="space-y-3">
				<h3 class="text-sm font-semibold">E-Mail-Muster (Regex)</h3>
				<p class="text-xs text-muted-foreground">
					Nutzer deren E-Mail auf eines dieser Muster passt, werden diesem Typ zugeordnet.
				</p>

				{#each editType.LenderTypePatterns as p (p.id)}
					<div class="flex items-center justify-between rounded-md border px-3 py-2">
						<code class="text-sm">{p.pattern}</code>
						<form method="POST" action="?/removePattern" use:enhance={handlePatternEnhance}>
							<input type="hidden" name="patternId" value={p.id} />
							<Button type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive">
								Entfernen
							</Button>
						</form>
					</div>
				{/each}

				<form method="POST" action="?/addPattern" use:enhance={handlePatternEnhance} class="flex gap-2">
					<input type="hidden" name="lenderTypeId" value={editType.id} />
					<Input name="pattern" bind:value={newPattern} placeholder="z.B. @stud\.hs-mannheim\.de$" class="flex-1 font-mono text-sm" />
					<Button type="submit" variant="outline" size="sm">Hinzufügen</Button>
				</form>
			</div>

			<Separator class="my-4" />

			<form method="POST" action="?/delete" use:enhance={handleEnhance} class="flex justify-start">
				<input type="hidden" name="id" value={editType.id} />
				<Button type="submit" variant="destructive" size="sm">Typ löschen</Button>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
