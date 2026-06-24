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
	import ItemStatusBadge from "$lib/components/admin/ItemStatusBadge.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Separator } from "$lib/components/ui/separator";

	export let data: any;
	export let form: any;

	let searchQuery = "";
	let statusFilter = "";
	let locationFilter = "";
	let showCreateDialog = false;
	let editItem: any = null;

	let newComponents: { name: string; description: string; quantity: number }[] = [];
	let editComponents: { name: string; description: string; quantity: number }[] = [];

	function addComponent(target: "new" | "edit") {
		if (target === "new") {
			newComponents = [...newComponents, { name: "", description: "", quantity: 1 }];
		} else {
			editComponents = [...editComponents, { name: "", description: "", quantity: 1 }];
		}
	}

	function removeComponent(target: "new" | "edit", index: number) {
		if (target === "new") {
			newComponents = newComponents.filter((_, i) => i !== index);
		} else {
			editComponents = editComponents.filter((_, i) => i !== index);
		}
	}

	const itemStatuses = ["Verfuegbar", "Defekt", "Gesperrt", "Verloren", "WartungErforderlich", "Aussortiert"];
	const statusLabels: Record<string, string> = {
		Verfuegbar: "Verfügbar",
		Defekt: "Defekt",
		Gesperrt: "Gesperrt",
		Verloren: "Verloren",
		WartungErforderlich: "Wartung erforderlich",
		Aussortiert: "Aussortiert",
	};

	$: items = data.items;
	$: locations = data.locations;
	$: tags = data.tags;
	$: lenderTypes = data.lenderTypes;

	$: filteredItems = items.filter((item: any) => {
		const matchesSearch =
			!searchQuery ||
			item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.articleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.bezeichnung.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = !statusFilter || item.itemStatus === statusFilter;
		const matchesLocation = !locationFilter || item.standortId === locationFilter;
		return matchesSearch && matchesStatus && matchesLocation;
	});

	function openEdit(item: any) {
		editItem = { ...item, tagIds: item.ItemTags.map((it: any) => it.tagId), lenderTypeIds: item.ItemLenderTypes.map((ilt: any) => ilt.lenderTypeId) };
		editComponents = (item.ItemComponents || []).map((c: any) => ({ name: c.name, description: c.description, quantity: c.quantity }));
	}

	function closeDialogs() {
		showCreateDialog = false;
		editItem = null;
		newComponents = [];
		editComponents = [];
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
		<h1 class="text-3xl font-bold">Inventar</h1>
		<Button on:click={() => showCreateDialog = true}>+ Neues Item</Button>
	</div>

	{#if form?.error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
			{form.error}
		</div>
	{/if}

	<Card.Root>
		<Card.Header>
			<div class="flex flex-wrap gap-3">
				<Input
					placeholder="Suchen..."
					bind:value={searchQuery}
					class="max-w-xs"
				/>
				<select
					bind:value={statusFilter}
					class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="">Alle Status</option>
					{#each itemStatuses as s}
						<option value={s}>{statusLabels[s]}</option>
					{/each}
				</select>
				<select
					bind:value={locationFilter}
					class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="">Alle Standorte</option>
					{#each locations as loc}
						<option value={loc.id}>{loc.standort}</option>
					{/each}
				</select>
			</div>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>ID</Table.Head>
						<Table.Head>Artikelname</Table.Head>
						<Table.Head>Bezeichnung</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Menge</Table.Head>
						<Table.Head>Standort</Table.Head>
						<Table.Head>Tags</Table.Head>
						<Table.Head>Ausleihertypen</Table.Head>
						<Table.Head class="w-[100px]">Aktionen</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredItems as item (item.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs">{item.id}</Table.Cell>
							<Table.Cell class="font-medium">{item.articleName}</Table.Cell>
							<Table.Cell>{item.bezeichnung}</Table.Cell>
							<Table.Cell>
								<ItemStatusBadge status={item.itemStatus} />
							</Table.Cell>
							<Table.Cell>
								{item.quantity}
								{#if item.defectQuantity > 0}
									<span class="text-red-500 text-xs ml-1">({item.defectQuantity} defekt)</span>
								{/if}
							</Table.Cell>
							<Table.Cell>{item.Standort?.standort || "—"}</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1">
									{#each item.ItemTags as it}
										<Badge variant="secondary" class="text-xs">{it.tag.name}</Badge>
									{/each}
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1">
									{#each item.ItemLenderTypes as ilt}
										<Badge variant="outline" class="text-xs">{ilt.lenderType.name}</Badge>
									{/each}
								</div>
							</Table.Cell>
							<Table.Cell>
								<Button variant="ghost" size="sm" on:click={() => openEdit(item)}>
									Bearbeiten
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if filteredItems.length === 0}
						<Table.Row>
							<Table.Cell colspan={9} class="text-center text-muted-foreground py-8">
								Keine Items gefunden
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

<!-- Create Dialog -->
<Dialog.Root open={showCreateDialog} onOpenChange={(open) => { if (!open) showCreateDialog = false; }}>
	<Dialog.Content class="max-w-lg max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Neues Item anlegen</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance={handleEnhance} class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div class="space-y-2">
					<Label for="id">Inventarnummer</Label>
					<Input id="id" name="id" placeholder="20260318-01" required />
				</div>
				<div class="space-y-2">
					<Label for="quantity">Menge</Label>
					<Input id="quantity" name="quantity" type="number" value="1" min="1" />
				</div>
				<div class="space-y-2">
					<Label for="defectQuantity">Defekt</Label>
					<Input id="defectQuantity" name="defectQuantity" type="number" value="0" min="0" />
				</div>
			</div>
			<div class="space-y-2">
				<Label for="articleName">Artikelname</Label>
				<Input id="articleName" name="articleName" required />
			</div>
			<div class="space-y-2">
				<Label for="bezeichnung">Bezeichnung</Label>
				<Input id="bezeichnung" name="bezeichnung" required />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="kaufdatum">Kaufdatum</Label>
					<Input id="kaufdatum" name="kaufdatum" type="date" value={new Date().toISOString().split('T')[0]} />
				</div>
				<div class="space-y-2">
					<Label for="kaufpreis">Kaufpreis (Cent)</Label>
					<Input id="kaufpreis" name="kaufpreis" type="number" value="0" min="0" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="itemStatus">Status</Label>
					<select name="itemStatus" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
						{#each itemStatuses as s}
							<option value={s}>{statusLabels[s]}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-2">
					<Label for="standortId">Standort</Label>
					<select name="standortId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
						<option value="">-- Kein Standort --</option>
						{#each locations as loc}
							<option value={loc.id}>{loc.standort}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="description">Beschreibung</Label>
				<Textarea id="description" name="description" />
			</div>
			<div class="space-y-2">
				<Label>Tags</Label>
				<div class="flex flex-wrap gap-2">
					{#each tags as tag}
						<label class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-accent">
							<input type="checkbox" name="tagIds" value={tag.id} class="rounded" />
							{tag.name}
						</label>
					{/each}
				</div>
			</div>
			<div class="space-y-2">
				<Label>Ausleihertypen</Label>
				<div class="flex flex-wrap gap-2">
					{#each lenderTypes as lt}
						<label class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-accent">
							<input type="checkbox" name="lenderTypeIds" value={lt.id} class="rounded" />
							{lt.name}
						</label>
					{/each}
				</div>
			</div>
			<div class="space-y-2">
				<Label>Bestandteile</Label>
				{#each newComponents as comp, i}
					<div class="flex gap-2 items-end">
						<Input name="componentName" bind:value={comp.name} placeholder="Name" class="flex-1" />
						<Input name="componentDescription" bind:value={comp.description} placeholder="Beschreibung" class="flex-1" />
						<Input name="componentQuantity" type="number" bind:value={comp.quantity} min="1" class="w-20" />
						<Button type="button" variant="ghost" size="sm" on:click={() => removeComponent("new", i)}>✕</Button>
					</div>
				{/each}
				<Button type="button" variant="outline" size="sm" on:click={() => addComponent("new")}>+ Bestandteil</Button>
			</div>
			<Dialog.Footer>
				<Button type="submit">Erstellen</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root open={!!editItem} onOpenChange={(open) => { if (!open) editItem = null; }}>
	<Dialog.Content class="max-w-lg max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Item bearbeiten</Dialog.Title>
		</Dialog.Header>
		{#if editItem}
			<form method="POST" action="?/update" use:enhance={handleEnhance} class="space-y-4">
				<input type="hidden" name="id" value={editItem.id} />
				<div class="space-y-2">
					<Label>Inventarnummer</Label>
					<Input value={editItem.id} disabled />
				</div>
				<div class="space-y-2">
					<Label for="edit-articleName">Artikelname</Label>
					<Input id="edit-articleName" name="articleName" value={editItem.articleName} required />
				</div>
				<div class="space-y-2">
					<Label for="edit-bezeichnung">Bezeichnung</Label>
					<Input id="edit-bezeichnung" name="bezeichnung" value={editItem.bezeichnung} required />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="edit-kaufdatum">Kaufdatum</Label>
						<Input id="edit-kaufdatum" name="kaufdatum" type="date" value={editItem.kaufdatum ? new Date(editItem.kaufdatum).toISOString().split('T')[0] : ''} />
					</div>
					<div class="space-y-2">
						<Label for="edit-kaufpreis">Kaufpreis (Cent)</Label>
						<Input id="edit-kaufpreis" name="kaufpreis" type="number" value={editItem.kaufpreis || 0} min="0" />
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div class="space-y-2">
						<Label for="edit-quantity">Menge</Label>
						<Input id="edit-quantity" name="quantity" type="number" value={editItem.quantity} min="1" />
					</div>
					<div class="space-y-2">
						<Label for="edit-defectQuantity">Defekt</Label>
						<Input id="edit-defectQuantity" name="defectQuantity" type="number" value={editItem.defectQuantity || 0} min="0" />
					</div>
					<div class="space-y-2">
						<Label for="edit-itemStatus">Status</Label>
						<select name="itemStatus" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							{#each itemStatuses as s}
								<option value={s} selected={editItem.itemStatus === s}>{statusLabels[s]}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="edit-standortId">Standort</Label>
					<select name="standortId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
						<option value="">-- Kein Standort --</option>
						{#each locations as loc}
							<option value={loc.id} selected={editItem.standortId === loc.id}>{loc.standort}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-2">
					<Label for="edit-description">Beschreibung</Label>
					<Textarea id="edit-description" name="description" value={editItem.description || ""} />
				</div>
				<div class="space-y-2">
					<Label>Tags</Label>
					<div class="flex flex-wrap gap-2">
						{#each tags as tag}
							<label class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-accent">
								<input
									type="checkbox"
									name="tagIds"
									value={tag.id}
									checked={editItem.tagIds?.includes(tag.id)}
									class="rounded"
								/>
								{tag.name}
							</label>
						{/each}
					</div>
				</div>
				<div class="space-y-2">
					<Label>Ausleihertypen</Label>
					<div class="flex flex-wrap gap-2">
						{#each lenderTypes as lt}
							<label class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-accent">
								<input
									type="checkbox"
									name="lenderTypeIds"
									value={lt.id}
									checked={editItem.lenderTypeIds?.includes(lt.id)}
									class="rounded"
								/>
								{lt.name}
							</label>
						{/each}
					</div>
				</div>
				<div class="space-y-2">
					<Label>Bestandteile</Label>
					{#each editComponents as comp, i}
						<div class="flex gap-2 items-end">
							<Input name="componentName" bind:value={comp.name} placeholder="Name" class="flex-1" />
							<Input name="componentDescription" bind:value={comp.description} placeholder="Beschreibung" class="flex-1" />
							<Input name="componentQuantity" type="number" bind:value={comp.quantity} min="1" class="w-20" />
							<Button type="button" variant="ghost" size="sm" on:click={() => removeComponent("edit", i)}>✕</Button>
						</div>
					{/each}
					<Button type="button" variant="outline" size="sm" on:click={() => addComponent("edit")}>+ Bestandteil</Button>
				</div>
				<Dialog.Footer class="flex justify-between">
					<div></div>
					<Button type="submit">Speichern</Button>
				</Dialog.Footer>
			</form>
			<Separator class="my-2" />
			<form method="POST" action="?/delete" use:enhance={handleEnhance} class="flex justify-start">
				<input type="hidden" name="id" value={editItem.id} />
				<Button type="submit" variant="destructive" size="sm">Item löschen</Button>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
