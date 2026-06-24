<script lang="ts">
	import ContentCard from '$lib/components/ContentCard.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';

	export let data;
	export let form: any;

	$: res = data.reservation;
	$: pending = data.activePending;
	$: addableItems = data.addableItems ?? [];

	let pickedNew: Array<{ itemId: string; label: string; max: number; qty: number }> = [];
	let search = '';

	$: pickedIds = new Set(pickedNew.map((p) => p.itemId));
	$: filteredAddable = addableItems
		.filter((i: any) => !pickedIds.has(i.id))
		.filter(
			(i: any) =>
				!search ||
				i.articleName.toLowerCase().includes(search.toLowerCase()) ||
				i.bezeichnung.toLowerCase().includes(search.toLowerCase()) ||
				i.id.toLowerCase().includes(search.toLowerCase())
		)
		.slice(0, 25);

	function addItem(item: any) {
		pickedNew = [
			...pickedNew,
			{
				itemId: item.id,
				label: `${item.articleName} (${item.bezeichnung})`,
				max: item.quantity,
				qty: 1
			}
		];
		search = '';
	}

	function removePickedNew(itemId: string) {
		pickedNew = pickedNew.filter((p) => p.itemId !== itemId);
	}
</script>

<ContentCard classes="max-w-3xl">
	<span slot="header">Ausleihantrag bearbeiten</span>

	<div class="space-y-6">
		{#if form?.error}
			<div
				class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
			>
				{form.error}
			</div>
		{/if}

		{#if pending}
			<div
				class="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
			>
				Du hast bereits eine unbestätigte Änderung in der Warteschlange. Wenn du eine neue
				vorschlägst, wird die alte ersetzt.
			</div>
		{/if}

		<p class="text-sm text-muted-foreground">
			Deine Änderungen werden erst wirksam, nachdem du sie per E-Mail-Link bestätigst. Alle
			Änderungen werden protokolliert.
		</p>

		<form method="POST" action="?/propose" class="space-y-6">
			<!-- Contact / Misc -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Kontakt &amp; Verwendung</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="phone">Telefon</Label>
						<Input id="phone" name="phone" value={res.phone ?? ''} />
					</div>
					<div class="space-y-2">
						<Label for="verwendungsort">Verwendungsort</Label>
						<Input
							id="verwendungsort"
							name="verwendungsort"
							value={res.verwendungsort ?? ''}
						/>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="reason">Verwendungszweck</Label>
						<Textarea
							id="reason"
							name="reason"
							value={res.reason}
							class="min-h-[80px]"
							required
						/>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Dates -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Zeitraum</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Ausleihzeitraum
						</p>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="startDate">Start</Label>
								<Input
									id="startDate"
									name="startDate"
									type="date"
									value={res.startDate}
								/>
							</div>
							<div class="space-y-2">
								<Label for="endDate">Ende</Label>
								<Input id="endDate" name="endDate" type="date" value={res.endDate} />
							</div>
						</div>
					</div>
					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Verwendungszeitraum
						</p>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="verwendungsStart">Start</Label>
								<Input
									id="verwendungsStart"
									name="verwendungsStart"
									type="date"
									value={res.verwendungsStart ?? ''}
								/>
							</div>
							<div class="space-y-2">
								<Label for="verwendungsEnd">Ende</Label>
								<Input
									id="verwendungsEnd"
									name="verwendungsEnd"
									type="date"
									value={res.verwendungsEnd ?? ''}
								/>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Item Quantities -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Gegenstände &amp; Mengen</Card.Title>
					<p class="text-sm text-muted-foreground">
						Bestehende Mengen anpassen oder weitere Gegenstände unten hinzufügen. Mit Menge 0
						wird ein Gegenstand aus der Ausleihe entfernt.
					</p>
				</Card.Header>
				<Card.Content class="space-y-6">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Gegenstand</Table.Head>
								<Table.Head class="w-32 text-center">Beantragt</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each res.AusleiheItems as ai (ai.id)}
								<Table.Row>
									<Table.Cell>
										<span class="font-medium">{ai.item.articleName}</span>
										<span class="ml-2 text-xs text-muted-foreground"
											>{ai.item.bezeichnung}</span
										>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Input
											type="number"
											name={`item_${ai.id}_beantragt`}
											value={ai.beantragt}
											min="0"
											max={ai.item.quantity}
											class="mx-auto w-24 text-center"
										/>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>

					<Separator />

					<div class="space-y-3">
						<p class="text-sm font-semibold">Neue Gegenstände hinzufügen</p>
						<p class="text-xs text-muted-foreground">
							Es werden nur Gegenstände angezeigt, die für deinen Ausleihertyp verfügbar sind.
						</p>

						{#if pickedNew.length > 0}
							<div class="rounded-md border">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Gegenstand</Table.Head>
											<Table.Head class="w-32 text-center">Menge</Table.Head>
											<Table.Head class="w-20"></Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each pickedNew as p (p.itemId)}
											<Table.Row>
												<Table.Cell>
													<span class="font-medium">{p.label}</span>
													<input type="hidden" name="newItemId" value={p.itemId} />
												</Table.Cell>
												<Table.Cell class="text-center">
													<Input
														type="number"
														name={`newItem_${p.itemId}_beantragt`}
														bind:value={p.qty}
														min="1"
														max={p.max}
														class="mx-auto w-24 text-center"
													/>
												</Table.Cell>
												<Table.Cell>
													<Button
														type="button"
														variant="outline"
														size="sm"
														on:click={() => removePickedNew(p.itemId)}
													>
														Entfernen
													</Button>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						{/if}

						<div class="space-y-2">
							<Label for="itemSearch">Gegenstand suchen</Label>
							<Input
								id="itemSearch"
								bind:value={search}
								placeholder="Name, Bezeichnung oder Inventarnummer..."
							/>
							{#if search}
								<div class="max-h-64 overflow-y-auto rounded-md border">
									{#if filteredAddable.length === 0}
										<p class="p-3 text-sm text-muted-foreground">Keine Treffer.</p>
									{:else}
										{#each filteredAddable as item (item.id)}
											<button
												type="button"
												class="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm hover:bg-accent last:border-b-0"
												on:click={() => addItem(item)}
											>
												<span>
													<span class="font-medium">{item.articleName}</span>
													<span class="ml-2 text-xs text-muted-foreground"
														>{item.bezeichnung}</span
													>
												</span>
												<span class="text-xs text-muted-foreground">+ Hinzufügen</span>
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Separator />

			<div class="flex flex-wrap gap-3">
				<Button type="submit">Änderung vorschlagen &amp; E-Mail anfordern</Button>
				<a
					href={`/reservation/${res.id}`}
					class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
				>
					Abbrechen
				</a>
			</div>
		</form>
	</div>
</ContentCard>
