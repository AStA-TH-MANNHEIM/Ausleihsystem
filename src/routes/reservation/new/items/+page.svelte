<script lang="ts">
	import { goto } from '$app/navigation';
	import NavButtons from '$lib/components/NavButtons.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { reservationStore, type PickedItem } from '../(stores)/reservationStore';

	export let data;

	$: items = data.items;
	$: tags = data.tags;

	let search = '';
	let selectedTags: number[] = [];

	// Filter items by search + tags
	$: filteredItems = items.filter((item) => {
		const matchesSearch =
			!search ||
			item.articleName.toLowerCase().includes(search.toLowerCase()) ||
			item.bezeichnung.toLowerCase().includes(search.toLowerCase()) ||
			item.id.toLowerCase().includes(search.toLowerCase());

		const matchesTags =
			selectedTags.length === 0 ||
			selectedTags.some((tagId) => item.ItemTags.some((it: any) => it.tag.id === tagId));

		return matchesSearch && matchesTags;
	});

	function toggleTag(tagId: number) {
		if (selectedTags.includes(tagId)) {
			selectedTags = selectedTags.filter((t) => t !== tagId);
		} else {
			selectedTags = [...selectedTags, tagId];
		}
	}

	// Reactive map so the template re-renders when the store changes
	$: pickedMap = new Map($reservationStore.pickedItems.map((p) => [p.itemId, p.quantity]));

	function setQuantity(item: any, qty: number) {
		const clamped = Math.max(0, Math.min(qty, item.available));
		const existing = $reservationStore.pickedItems;

		if (clamped === 0) {
			$reservationStore.pickedItems = existing.filter((p) => p.itemId !== item.id);
		} else {
			const idx = existing.findIndex((p) => p.itemId === item.id);
			const entry: PickedItem = {
				itemId: item.id,
				articleName: item.articleName,
				bezeichnung: item.bezeichnung,
				quantity: clamped,
				maxAvailable: item.available
			};
			if (idx >= 0) {
				existing[idx] = entry;
				$reservationStore.pickedItems = [...existing];
			} else {
				$reservationStore.pickedItems = [...existing, entry];
			}
		}
	}

	function incrementItem(item: any) {
		setQuantity(item, (pickedMap.get(item.id) || 0) + 1);
	}

	function decrementItem(item: any) {
		setQuantity(item, (pickedMap.get(item.id) || 0) - 1);
	}

	$: pickedItems = $reservationStore.pickedItems;
	$: totalPicked = pickedItems.reduce((s, p) => s + p.quantity, 0);

	function handleBack() {
		goto('/reservation/new/dates');
	}

	async function handleSubmit() {
		if (pickedItems.length === 0) return;

		const body = {
			lenderTypeId: $reservationStore.lenderTypeId,
			vorname: $reservationStore.vorname,
			nachname: $reservationStore.nachname,
			email: $reservationStore.email,
			phone: $reservationStore.phone || 'N/A',
			reason: $reservationStore.reason,
			verwendungsort: $reservationStore.verwendungsort,
			startDate: $reservationStore.startDate,
			endDate: $reservationStore.endDate,
			verwendungsStart: $reservationStore.verwendungsStart,
			verwendungsEnd: $reservationStore.verwendungsEnd,
			items: pickedItems.map((p) => ({ itemId: p.itemId, quantity: p.quantity }))
		};

		submitError = '';
		submitting = true;

		try {
			const res = await fetch('/reservation/new/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const result = await res.json();

			if (!res.ok) {
				submitError = result.error || 'Ein Fehler ist aufgetreten.';
				return;
			}

			goto('/reservation/new/verification');
		} catch (e) {
			submitError = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
		} finally {
			submitting = false;
		}
	}

	let submitting = false;
	let submitError = '';
</script>

<div class="space-y-4">
	<!-- Search and Filters -->
	<div class="space-y-3">
		<Input bind:value={search} placeholder="Gegenstände suchen..." class="max-w-md" />

		{#if tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each tags as tag (tag.id)}
					<button on:click={() => toggleTag(tag.id)}>
						<Badge variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}>
							{tag.name}
						</Badge>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Selected Items Summary (mobile: top, desktop: sidebar) -->
	<div class="lg:hidden">
		<Card.Root>
			<Card.Content class="py-3">
				{#if pickedItems.length === 0}
					<p class="text-sm text-muted-foreground">Noch keine Gegenstände ausgewählt.</p>
				{:else}
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Ausgewählt: {totalPicked} Gegenstände</span>
						<div class="flex flex-wrap gap-1">
							{#each pickedItems as picked (picked.itemId)}
								<Badge variant="secondary" class="text-xs">{picked.articleName} ({picked.quantity}x)</Badge>
							{/each}
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 lg:grid-cols-3">
		<!-- Items List -->
		<div class="lg:col-span-2">
			<!-- Mobile: Card layout -->
			<div class="space-y-2 md:hidden">
				{#each filteredItems as item (item.id)}
					{@const picked = pickedMap.get(item.id) || 0}
					<div
						class="rounded-lg border p-3 {picked > 0 ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : ''}"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0 flex-1">
								<p class="font-medium">{item.articleName}</p>
								<p class="text-xs text-muted-foreground">{item.bezeichnung}</p>
								{#if item.ItemTags.length > 0}
									<div class="mt-1 flex flex-wrap gap-1">
										{#each item.ItemTags as it}
											<Badge variant="outline" class="text-xs">{it.tag.name}</Badge>
										{/each}
									</div>
								{/if}
							</div>
							<span
								class="shrink-0 text-xs {item.available === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}"
							>
								{item.available} verf.
							</span>
						</div>
						<div class="mt-2 flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								class="h-8 w-8 p-0"
								disabled={picked === 0}
								on:click={() => decrementItem(item)}
							>
								-
							</Button>
							<span class="w-8 text-center text-sm font-medium">{picked}</span>
							<Button
								variant="outline"
								size="sm"
								class="h-8 w-8 p-0"
								disabled={picked >= item.available}
								on:click={() => incrementItem(item)}
							>
								+
							</Button>
						</div>
					</div>
				{/each}
				{#if filteredItems.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">Keine Gegenstände gefunden</p>
				{/if}
			</div>

			<!-- Desktop: Table layout -->
			<Card.Root class="hidden md:block">
				<Card.Content class="pt-6">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Gegenstand</Table.Head>
								<Table.Head class="w-[100px] text-center">Verfügbar</Table.Head>
								<Table.Head class="w-[160px] text-center">Anzahl</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each filteredItems as item (item.id)}
								{@const picked = pickedMap.get(item.id) || 0}
								<Table.Row class={picked > 0 ? 'bg-green-50 dark:bg-green-950/30' : ''}>
									<Table.Cell>
										<div>
											<span class="font-medium">{item.articleName}</span>
											<span class="ml-2 text-xs text-muted-foreground"
												>{item.bezeichnung}</span
											>
										</div>
										{#if item.ItemTags.length > 0}
											<div class="mt-1 flex flex-wrap gap-1">
												{#each item.ItemTags as it}
													<Badge variant="outline" class="text-xs"
														>{it.tag.name}</Badge
													>
												{/each}
											</div>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-center">
										<span
											class={item.available === 0
												? 'text-destructive font-medium'
												: ''}
										>
											{item.available}
										</span>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center justify-center gap-2">
											<Button
												variant="outline"
												size="sm"
												class="h-8 w-8 p-0"
												disabled={picked === 0}
												on:click={() => decrementItem(item)}
											>
												-
											</Button>
											<span class="w-8 text-center font-medium">{picked}</span>
											<Button
												variant="outline"
												size="sm"
												class="h-8 w-8 p-0"
												disabled={picked >= item.available}
												on:click={() => incrementItem(item)}
											>
												+
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
							{#if filteredItems.length === 0}
								<Table.Row>
									<Table.Cell colspan={3} class="py-8 text-center text-muted-foreground">
										Keine Gegenstände gefunden
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Desktop: Selected Items Sidebar -->
		<div class="hidden lg:block">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Ausgewählt ({totalPicked})</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if pickedItems.length === 0}
						<p class="text-sm text-muted-foreground">Noch keine Gegenstände ausgewählt.</p>
					{:else}
						<div class="space-y-2">
							{#each pickedItems as picked (picked.itemId)}
								<div class="flex items-center justify-between text-sm">
									<span class="truncate">{picked.articleName}</span>
									<Badge variant="secondary">{picked.quantity}x</Badge>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	{#if submitError}
		<div
			class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
		>
			{submitError}
		</div>
	{/if}

	<Separator />

	<NavButtons
		show_b1={true}
		b1_lable="Zurück"
		b1_function={handleBack}
		show_b2={true}
		b2_lable={submitting ? 'Wird gesendet...' : 'Antrag absenden'}
		b2_function={handleSubmit}
		b2_disabled={pickedItems.length === 0 || submitting}
	/>
</div>
