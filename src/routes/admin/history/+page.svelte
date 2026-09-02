<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";

	export let data: any;

	const actionLabels: Record<string, string> = {
		CREATE: "Hinzugefügt",
		UPDATE: "Bearbeitet",
		DELETE: "Gelöscht",
	};
	const actionClasses: Record<string, string> = {
		CREATE: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
		UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
		DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
	};

	// Datumsfelder als freier Text im Format TT.MM.JJJJ - das native <input type="date">
	// zeigt je nach Browser-Sprache US-Format und laesst sich schlecht tippen.
	let from = data.filters.fromInput;
	let to = data.filters.toInput;
	let actorId = data.filters.actorId;
	let action = data.filters.action;
	let q = data.filters.q;

	// Nach einer Navigation (neue Filter in der URL) die Felder wieder angleichen
	$: if (data.filters) {
		from = data.filters.fromInput;
		to = data.filters.toInput;
		actorId = data.filters.actorId;
		action = data.filters.action;
		q = data.filters.q;
	}

	function deDate(date: Date): string {
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
	}

	/**
	 * Welcher Dropdown-Eintrag passt zu einem Datumspaar?
	 * Ein volles Kalenderjahr wird als Jahr erkannt, alles andere ist "benutzerdefiniert".
	 */
	function detectRange(fromValue: string, toValue: string): string {
		if (!fromValue && !toValue) return "all";
		const year = /^0?1\.0?1\.(\d{4})$/.exec(fromValue)?.[1];
		if (year && toValue === `31.12.${year}`) return year;
		return "custom";
	}

	// Auswahl fuer den ersten Render (auch serverseitig), damit das Dropdown sofort
	// den Zeitraum aus der URL zeigt und nicht erst nach der Hydration.
	$: rangeSelection = detectRange(data.filters.fromInput, data.filters.toInput);

	let rangeEl: HTMLSelectElement | undefined;

	/** Dropdown -> Textfelder */
	function onRangeChange(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		const now = new Date();

		// "Benutzerdefiniert" laesst die Felder bewusst unangetastet
		if (value === "custom") return;

		if (value === "all") {
			from = "";
			to = "";
		} else if (value === "month") {
			from = deDate(new Date(now.getFullYear(), now.getMonth(), 1));
			to = deDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
		} else if (value === "30d") {
			const start = new Date(now);
			start.setDate(start.getDate() - 29);
			from = deDate(start);
			to = deDate(now);
		} else {
			from = `01.01.${value}`;
			to = `31.12.${value}`;
		}
	}

	/** Textfelder -> Dropdown (beim Tippen auf "Benutzerdefiniert" umschalten) */
	function onDateInput() {
		if (rangeEl) rangeEl.value = detectRange(from, to);
	}

	// Query-String für den CSV-Export – identisch zu den aktuell angezeigten Filtern
	$: exportQuery = new URLSearchParams({
		from: data.filters.from,
		to: data.filters.to,
		actorId: data.filters.actorId,
		action: data.filters.action,
		q: data.filters.q,
	}).toString();

	const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
		dateStyle: "short",
		timeStyle: "medium",
	});

	function formatTimestamp(value: string | Date): string {
		return dateTimeFormat.format(new Date(value));
	}
	$: truncated = data.total > data.entries.length;
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Inventar-Historie</h1>
			<p class="text-sm text-muted-foreground">
				Wer hat welches Item hinzugefügt, bearbeitet oder gelöscht?
			</p>
		</div>
		<Button href="/admin/history/export?{exportQuery}" data-sveltekit-reload>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mr-2 h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
				/>
			</svg>
			CSV exportieren
		</Button>
	</div>

	<Card.Root>
		<Card.Header>
			<form method="GET" class="space-y-4">
				<div class="flex flex-wrap items-end gap-3">
					<div class="space-y-1">
						<Label for="range">Zeitraum</Label>
						<select
							id="range"
							bind:this={rangeEl}
							on:change={onRangeChange}
							class="flex h-10 w-[190px] rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="all" selected={rangeSelection === "all"}>Gesamter Zeitraum</option>
							{#each data.years as year}
								<option value={String(year)} selected={rangeSelection === String(year)}>
									{year}
								</option>
							{/each}
							<option value="month">Dieser Monat</option>
							<option value="30d">Letzte 30 Tage</option>
							<option value="custom" selected={rangeSelection === "custom"}>
								Benutzerdefiniert …
							</option>
						</select>
					</div>
					<div class="space-y-1">
						<Label for="from">Von</Label>
						<Input
							id="from"
							name="from"
							bind:value={from}
							on:input={onDateInput}
							placeholder="TT.MM.JJJJ"
							inputmode="numeric"
							autocomplete="off"
							class="w-[140px]"
						/>
					</div>
					<div class="space-y-1">
						<Label for="to">Bis</Label>
						<Input
							id="to"
							name="to"
							bind:value={to}
							on:input={onDateInput}
							placeholder="TT.MM.JJJJ"
							inputmode="numeric"
							autocomplete="off"
							class="w-[140px]"
						/>
					</div>
					<div class="space-y-1">
						<Label for="actorId">Benutzer</Label>
						<select
							id="actorId"
							name="actorId"
							bind:value={actorId}
							class="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="">Alle Benutzer</option>
							{#each data.users as user (user.id)}
								<option value={user.id}>{user.username}</option>
							{/each}
							<option value="__none__">Ohne Benutzerzuordnung</option>
						</select>
					</div>
					<div class="space-y-1">
						<Label for="action">Aktion</Label>
						<select
							id="action"
							name="action"
							bind:value={action}
							class="flex h-10 w-[170px] rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="">Alle Aktionen</option>
							<option value="CREATE">Hinzugefügt</option>
							<option value="UPDATE">Bearbeitet</option>
							<option value="DELETE">Gelöscht</option>
						</select>
					</div>
					<div class="space-y-1">
						<Label for="q">Item</Label>
						<Input
							id="q"
							name="q"
							bind:value={q}
							placeholder="Inventarnummer oder Name"
							class="w-[240px]"
						/>
					</div>
					<Button type="submit">Anzeigen</Button>
					<Button variant="outline" href="/admin/history">Zurücksetzen</Button>
				</div>

				{#if data.invalidDates.length > 0}
					<p class="text-sm text-red-600 dark:text-red-400">
						{data.invalidDates.join(" und ")}
						{data.invalidDates.length === 1 ? "wurde" : "wurden"} nicht als Datum erkannt und
						{data.invalidDates.length === 1 ? "bleibt" : "bleiben"} unberücksichtigt. Format: TT.MM.JJJJ
					</p>
				{:else}
					<p class="text-xs text-muted-foreground">
						Zeitraum auswählen oder Datum direkt eintippen (TT.MM.JJJJ). Leere Felder = keine Grenze.
					</p>
				{/if}
			</form>
		</Card.Header>
		<Card.Content>
			<div class="mb-3 text-sm text-muted-foreground">
				{data.total}
				{data.total === 1 ? "Eintrag" : "Einträge"} im gewählten Zeitraum
				{#if truncated}
					<span class="ml-1">
						– angezeigt werden die neuesten {data.entries.length}. Der CSV-Export enthält alle.
					</span>
				{/if}
			</div>

			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[160px]">Zeitpunkt</Table.Head>
						<Table.Head class="w-[130px]">Aktion</Table.Head>
						<Table.Head class="w-[140px]">Inventarnummer</Table.Head>
						<Table.Head>Item</Table.Head>
						<Table.Head class="w-[160px]">Benutzer</Table.Head>
						<Table.Head>Änderungen</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.entries as entry (entry.id)}
						<Table.Row>
							<Table.Cell class="whitespace-nowrap text-sm">
								{formatTimestamp(entry.timestamp)}
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {actionClasses[
										entry.action
									] ?? ''}"
								>
									{actionLabels[entry.action] ?? entry.action}
								</span>
							</Table.Cell>
							<Table.Cell class="font-mono text-xs">{entry.itemId}</Table.Cell>
							<Table.Cell>{entry.itemLabel}</Table.Cell>
							<Table.Cell class="font-medium">{entry.actorName}</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">
								{entry.changesText || "—"}
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if data.entries.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="py-8 text-center text-muted-foreground">
								Keine Einträge im gewählten Zeitraum
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
