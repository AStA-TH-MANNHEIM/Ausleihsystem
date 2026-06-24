<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import StatusBadge from "$lib/components/admin/StatusBadge.svelte";

	export let data;

	$: stats = data.stats;
	$: recentReservations = data.recentReservations;

	const statCards = [
		{ label: "Aktive Ausleihen", key: "activeLoans" as const, color: "text-blue-600" },
		{ label: "Ausstehend", key: "pendingCount" as const, color: "text-yellow-600" },
		{ label: "Überfällig", key: "overdueLoans" as const, color: "text-red-600" },
		{ label: "Inventar gesamt", key: "totalItems" as const, color: "text-foreground" },
		{ label: "Defekt / Wartung", key: "defectItems" as const, color: "text-orange-600" },
	];
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold">Dashboard</h1>

	<div class="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
		{#each statCards as card}
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>{card.label}</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl font-bold {card.color}">{stats[card.key]}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Letzte Ausleihen</Card.Title>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>E-Mail</Table.Head>
						<Table.Head>Zeitraum</Table.Head>
						<Table.Head>Items</Table.Head>
						<Table.Head>Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each recentReservations as res}
						<Table.Row class="cursor-pointer" on:click={() => window.location.href = `/admin/reservations/${res.id}`}>
							<Table.Cell class="font-medium">{res.vorname} {res.nachname}</Table.Cell>
							<Table.Cell>{res.email}</Table.Cell>
							<Table.Cell>{res.startDate} - {res.endDate}</Table.Cell>
							<Table.Cell>{res.AusleiheItems.length}</Table.Cell>
							<Table.Cell>
								<StatusBadge status={res.ausleihStatus} />
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if recentReservations.length === 0}
						<Table.Row>
							<Table.Cell colspan={5} class="text-center text-muted-foreground py-8">
								Keine Ausleihen vorhanden
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
