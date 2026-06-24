<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
	import PfandBadge from "$lib/components/admin/PfandBadge.svelte";

	export let data: any;

	let searchQuery = "";
	let statusFilter = "";

	const statuses = [
		"Angemeldet", "Verifiziert", "Reserviert", "Gebucht",
		"ImGange", "Abgeschlossen", "AbgeschlUnvollst", "Storniert",
	];
	const statusLabels: Record<string, string> = {
		Angemeldet: "Angemeldet",
		Verifiziert: "Warten auf Genehmigung",
		Reserviert: "Reserviert",
		Gebucht: "Bereit zur Abholung",
		ImGange: "Im Gange",
		Abgeschlossen: "Abgeschlossen",
		AbgeschlUnvollst: "Unvollständig",
		Storniert: "Storniert",
	};

	$: reservations = data.reservations;

	$: filtered = reservations.filter((res: any) => {
		const matchesSearch =
			!searchQuery ||
			`${res.vorname} ${res.nachname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
			res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			res.id.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = !statusFilter || res.ausleihStatus === statusFilter;
		return matchesSearch && matchesStatus;
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Ausleihen</h1>
	</div>

	<Card.Root>
		<Card.Header>
			<div class="flex flex-wrap gap-3">
				<Input
					placeholder="Name, E-Mail oder ID suchen..."
					bind:value={searchQuery}
					class="max-w-xs"
				/>
				<select
					bind:value={statusFilter}
					class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="">Alle Status</option>
					{#each statuses as s}
						<option value={s}>{statusLabels[s] || s}</option>
					{/each}
				</select>
			</div>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>E-Mail</Table.Head>
						<Table.Head>Ausleihzeitraum</Table.Head>
						<Table.Head>Eventzeitraum</Table.Head>
						<Table.Head>Items</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Pfand</Table.Head>
						<Table.Head class="w-[100px]"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filtered as res (res.id)}
						<Table.Row class="cursor-pointer" on:click={() => window.location.href = `/admin/reservations/${res.id}`}>
							<Table.Cell class="font-medium">{res.vorname} {res.nachname}</Table.Cell>
							<Table.Cell>{res.email}</Table.Cell>
							<Table.Cell class="whitespace-nowrap">{res.startDate} — {res.endDate}</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								{#if res.verwendungsStart || res.verwendungsEnd}
									{res.verwendungsStart || "—"} — {res.verwendungsEnd || "—"}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>{res.AusleiheItems.length}</Table.Cell>
							<Table.Cell>
								<StatusBadge status={res.ausleihStatus} />
							</Table.Cell>
							<Table.Cell>
								<PfandBadge status={res.pfandStatus} />
							</Table.Cell>
							<Table.Cell>
								<a href="/admin/reservations/{res.id}" class="text-sm font-medium text-muted-foreground hover:text-foreground">
									Details
								</a>
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if filtered.length === 0}
						<Table.Row>
							<Table.Cell colspan={8} class="text-center text-muted-foreground py-8">
								Keine Ausleihen gefunden
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
