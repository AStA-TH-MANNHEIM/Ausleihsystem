<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import * as Tabs from "$lib/components/ui/tabs";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Separator } from "$lib/components/ui/separator";
	import { Badge } from "$lib/components/ui/badge";
	import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
	import PfandBadge from "$lib/components/admin/PfandBadge.svelte";
	import { selectListValues, isItemApprovePossible, isItemReturnPossible, isTerminalState } from "$lib/services/reservationStateService";

	export let data: any;
	export let form: any;

	$: res = data.reservation;
	$: users = data.users;
	$: possibleStatuses = selectListValues(res.ausleihStatus);
	$: terminal = isTerminalState(res.ausleihStatus);
	$: canApprove = isItemApprovePossible(res.ausleihStatus);
	$: canEditGenehmigt = res.ausleihStatus === "Verifiziert" || res.ausleihStatus === "Reserviert";
	$: canReturn = isItemReturnPossible(res.ausleihStatus);
	$: changeLogs = data.changeLogs ?? [];
	$: activePending = data.activePending;
	$: isEditable = data.isEditable;

	let commentContent = "";
	let commentHidden = true;
	let showHelp = false;

	const sourceLabels: Record<string, string> = { USER: "Antragsteller", ADMIN: "Admin" };
	const logStatusLabels: Record<string, string> = {
		PENDING: "Ausstehend",
		APPLIED: "Übernommen",
		SUPERSEDED: "Ersetzt",
		CANCELLED: "Abgebrochen",
	};

	type ChangeEntry = { label: string; oldValue: string | number | null; newValue: string | number | null };
	function changeEntries(raw: unknown): ChangeEntry[] {
		return Array.isArray(raw) ? (raw as ChangeEntry[]) : [];
	}

	$: addableItems = data.addableItems ?? [];

	let admPickedNew: Array<{ itemId: string; label: string; max: number; qty: number }> = [];
	let admSearch = "";

	$: admPickedIds = new Set(admPickedNew.map((p) => p.itemId));
	$: admFilteredAddable = addableItems
		.filter((i: any) => !admPickedIds.has(i.id))
		.filter(
			(i: any) =>
				!admSearch ||
				i.articleName.toLowerCase().includes(admSearch.toLowerCase()) ||
				i.bezeichnung.toLowerCase().includes(admSearch.toLowerCase()) ||
				i.id.toLowerCase().includes(admSearch.toLowerCase()),
		)
		.slice(0, 25);

	function admAddItem(item: any) {
		admPickedNew = [
			...admPickedNew,
			{
				itemId: item.id,
				label: `${item.articleName} (${item.bezeichnung})`,
				max: item.quantity,
				qty: 1,
			},
		];
		admSearch = "";
	}

	function admRemovePickedNew(itemId: string) {
		admPickedNew = admPickedNew.filter((p) => p.itemId !== itemId);
	}

	const pfandStatuses = ["PfandNichtFestgelegt", "PfandBezahlt", "PfandZurueckgegeben"];
	const pfandLabels: Record<string, string> = {
		PfandNichtFestgelegt: "Nicht festgelegt",
		PfandBezahlt: "Bezahlt",
		PfandZurueckgegeben: "Zurückgegeben",
	};

	function formatDate(d: string) {
		if (!d) return "—";
		return d;
	}

	// Status timeline steps
	const statusSteps = ["Angemeldet", "Verifiziert", "Reserviert", "Gebucht", "ImGange", "Abgeschlossen"];
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

	const statusOrder: Record<string, number> = {
		Angemeldet: 0, Verifiziert: 1, Reserviert: 2, Gebucht: 3, ImGange: 4, Abgeschlossen: 5,
	};

	$: currentStepIndex = statusOrder[res.ausleihStatus] ?? -1;
	$: totalBeantragt = res.AusleiheItems.reduce((s: number, i: any) => s + i.beantragt, 0);
	$: totalZurueck = res.AusleiheItems.reduce((s: number, i: any) => s + i.zurueckgebracht, 0);

	function handleEnhance() {
		return async () => {
			await invalidateAll();
		};
	}

	const copyDefaultLabel = "Antragsteller-Link kopieren";
	let copyLabel = copyDefaultLabel;
	let copyTimer: ReturnType<typeof setTimeout>;

	async function copyUserUrl() {
		const url = `${window.location.origin}/reservation/${res.id}`;
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url);
			} else {
				// Fallback for non-secure contexts (http without localhost)
				const ta = document.createElement("textarea");
				ta.value = url;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
			}
			copyLabel = "Kopiert!";
		} catch {
			copyLabel = "Kopieren fehlgeschlagen";
		}
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copyLabel = copyDefaultLabel), 2000);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<div class="flex items-center gap-3">
				<a href="/admin/reservations" class="text-muted-foreground hover:text-foreground">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</a>
				<h1 class="text-3xl font-bold">{res.vorname} {res.nachname}</h1>
				<StatusBadge status={res.ausleihStatus} />
			</div>
			<p class="text-sm text-muted-foreground">{res.email} | {res.phone || "—"}</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" on:click={copyUserUrl} title="Den Link kopieren, den der Antragsteller zum Einsehen/Buchen verwendet">
				{copyLabel}
			</Button>
			<Button variant="outline" href="/admin/reservations/{res.id}/pdf" target="_blank">
				PDF herunterladen
			</Button>
		{#if res.ausleihStatus === "Reserviert"}
			<form method="POST" action="?/markReadyForPickup" use:enhance={handleEnhance} class="flex items-center gap-2">
				<Input name="abholort" placeholder="Abholort eingeben..." required class="w-64" />
				<Button type="submit" class="bg-orange-600 hover:bg-orange-700">Bereit zur Abholung</Button>
			</form>
		{:else if res.ausleihStatus === "Gebucht"}
			<form method="POST" action="?/markPickedUp" use:enhance={handleEnhance}>
				<Button type="submit" class="bg-purple-600 hover:bg-purple-700">Abgeholt</Button>
			</form>
		{/if}
		</div>
	</div>

	{#if form?.error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
			{form.error}
		</div>
	{/if}

	<!-- Status Timeline -->
	{#if !terminal || res.ausleihStatus === "Abgeschlossen"}
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center justify-between">
					{#each statusSteps as step, i}
						<div class="flex flex-col items-center gap-1">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
								{i <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}"
							>
								{i + 1}
							</div>
							<span class="text-xs {i <= currentStepIndex ? 'font-medium' : 'text-muted-foreground'}">
								{statusLabels[step]}
							</span>
						</div>
						{#if i < statusSteps.length - 1}
							<div class="flex-1 mx-2">
								<div class="h-0.5 {i < currentStepIndex ? 'bg-primary' : 'bg-muted'}"></div>
							</div>
						{/if}
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="pt-6 text-center">
				<StatusBadge status={res.ausleihStatus} />
				<p class="mt-2 text-sm text-muted-foreground">Diese Ausleihe wurde beendet.</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- How to use -->
	<button
		on:click={() => showHelp = !showHelp}
		class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		{showHelp ? "Anleitung ausblenden" : "Anleitung anzeigen"}
	</button>
	{#if showHelp}
		<Card.Root class="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
			<Card.Content class="pt-6">
				<div class="space-y-3 text-sm">
					<p class="font-semibold text-blue-900 dark:text-blue-100">Ablauf einer Ausleihe:</p>
					<ol class="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
						<li><strong>Angemeldet</strong> — Antrag wurde eingereicht. Der Antragsteller muss seine E-Mail verifizieren.</li>
						<li><strong>Warten auf Genehmigung</strong> — E-Mail verifiziert. Im Tab "Items" die gewünschten Mengen prüfen und ggf. anpassen, dann unten auf <strong>"Ausleihe genehmigen"</strong> klicken.</li>
						<li><strong>Reserviert</strong> — Ausleihe genehmigt. Abholort eingeben und <strong>"Bereit zur Abholung"</strong> klicken. Bei Bedarf kann der Status zurück auf "Warten auf Genehmigung" gesetzt werden.</li>
						<li><strong>Bereit zur Abholung</strong> — Antragsteller wurde informiert. Bei Abholung auf <strong>"Abgeholt"</strong> klicken.</li>
						<li><strong>Im Gange</strong> — Items sind ausgeliehen. Im Tab "Items" die Rückgabemengen eintragen. Status auf "Abgeschlossen" oder "Unvollständig" setzen.</li>
					</ol>
					<p class="text-blue-700 dark:text-blue-300">In jedem Status kann die Ausleihe über das Dropdown <strong>"Storniert"</strong> werden.</p>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if activePending}
		<Card.Root class="border-yellow-300 bg-yellow-50/60 dark:border-yellow-700 dark:bg-yellow-950/40">
			<Card.Content class="pt-6">
				<p class="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
					Vom Antragsteller vorgeschlagene Änderung wartet auf Bestätigung per E-Mail.
				</p>
				<p class="mt-1 text-xs text-yellow-800 dark:text-yellow-200">
					Solange diese Änderung nicht bestätigt ist, bleibt der Antrag in seinem aktuellen
					Zustand. Du siehst sie im Tab "Änderungsverlauf".
				</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<Tabs.Root value="info">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="info">Allgemein</Tabs.Trigger>
			<Tabs.Trigger value="items">Items ({res.AusleiheItems.length})</Tabs.Trigger>
			<Tabs.Trigger value="edit">Bearbeiten</Tabs.Trigger>
			<Tabs.Trigger value="history">Änderungsverlauf ({changeLogs.length})</Tabs.Trigger>
			<Tabs.Trigger value="comments">Kommentare ({res.AusleiheComments.length})</Tabs.Trigger>
		</Tabs.List>

		<!-- General Info Tab -->
		<Tabs.Content value="info">
			<div class="grid gap-6 md:grid-cols-2">
				<!-- Contact Info -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Kontaktdaten</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="grid grid-cols-2 gap-2 text-sm">
							<span class="text-muted-foreground">Name:</span>
							<span class="font-medium">{res.vorname} {res.nachname}</span>
							<span class="text-muted-foreground">E-Mail:</span>
							{#if res.ausleihStatus === "Angemeldet"}
								<form method="POST" action="?/updateEmail" use:enhance={handleEnhance} class="flex items-center gap-2">
									<Input name="email" value={res.email} type="email" class="h-8 text-sm" />
									<Button type="submit" variant="outline" size="sm">Speichern</Button>
								</form>
							{:else}
								<span>{res.email}</span>
							{/if}
							<span class="text-muted-foreground">Telefon:</span>
							<span>{res.phone || "—"}</span>
							<span class="text-muted-foreground">Verwendungszweck:</span>
							<span>{res.reason}</span>
							{#if res.verwendungsort}
								<span class="text-muted-foreground">Verwendungsort:</span>
								<span>{res.verwendungsort}</span>
							{/if}
						</div>
						{#if res.ausleihStatus === "Angemeldet"}
							<Separator class="my-3" />
							<form method="POST" action="?/markVerified" use:enhance={handleEnhance}>
								<Button type="submit" class="w-full bg-blue-600 hover:bg-blue-700">
									Als verifiziert markieren (Warten auf Genehmigung)
								</Button>
							</form>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Dates -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Zeitraum</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ausleihzeitraum</p>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<span class="text-muted-foreground">Start:</span>
							<span class="font-medium">{formatDate(res.startDate)}</span>
							<span class="text-muted-foreground">Ende:</span>
							<span class="font-medium">{formatDate(res.endDate)}</span>
						</div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3">Eventzeitraum</p>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<span class="text-muted-foreground">Start:</span>
							<span class="font-medium">{res.verwendungsStart ? formatDate(res.verwendungsStart) : "—"}</span>
							<span class="text-muted-foreground">Ende:</span>
							<span class="font-medium">{res.verwendungsEnd ? formatDate(res.verwendungsEnd) : "—"}</span>
						</div>
						{#if res.abholort}
							<div class="grid grid-cols-2 gap-2 text-sm mt-3">
								<span class="text-muted-foreground">Abholort:</span>
								<span class="font-medium">{res.abholort}</span>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Status Controls -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Status ändern</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if !terminal}
							<form method="POST" action="?/updateStatus" use:enhance={handleEnhance} class="flex items-end gap-3">
								<div class="flex-1 space-y-2">
									<Label>Neuer Status</Label>
									<select name="ausleihStatus" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
										{#each possibleStatuses as s}
											<option value={s} selected={s === res.ausleihStatus}>
												{statusLabels[s] || s}
											</option>
										{/each}
									</select>
								</div>
								<Button type="submit">Ändern</Button>
							</form>
						{:else}
							<p class="text-sm text-muted-foreground">Status kann nicht mehr geändert werden.</p>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Pfand -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Pfand</Card.Title>
					</Card.Header>
					<Card.Content>
						<form method="POST" action="?/updatePfand" use:enhance={handleEnhance} class="space-y-3">
							<div class="flex items-center gap-3">
								<PfandBadge status={res.pfandStatus} />
								<span class="text-sm font-medium">
									{res.pfandBetrag ? `${(res.pfandBetrag / 100).toFixed(2)} €` : "Kein Betrag"}
								</span>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-2">
									<Label>Betrag (Cent)</Label>
									<Input name="pfandBetrag" type="number" value={res.pfandBetrag} min="0" />
								</div>
								<div class="space-y-2">
									<Label>Pfand-Status</Label>
									<select name="pfandStatus" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
										{#each pfandStatuses as s}
											<option value={s} selected={s === res.pfandStatus}>{pfandLabels[s]}</option>
										{/each}
									</select>
								</div>
							</div>
							<Button type="submit" variant="outline" size="sm">Pfand aktualisieren</Button>
						</form>
					</Card.Content>
				</Card.Root>

				<!-- Assigned Users -->
				<Card.Root class="md:col-span-2">
					<Card.Header>
						<Card.Title class="text-lg">Zugewiesene Betreuer</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="grid gap-4 md:grid-cols-2">
							<form method="POST" action="?/assignUser" use:enhance={handleEnhance} class="space-y-2">
								<input type="hidden" name="field" value="ausgabe" />
								<Label>Ausgabe (Übergabe)</Label>
								<div class="flex gap-2">
									<select name="userId" class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
										<option value="">— Nicht zugewiesen —</option>
										{#each users as u}
											<option value={u.id} selected={u.id === res.assignedUserAusgabeId}>{u.username}</option>
										{/each}
									</select>
									<Button type="submit" variant="outline" size="sm">Setzen</Button>
								</div>
							</form>
							<form method="POST" action="?/assignUser" use:enhance={handleEnhance} class="space-y-2">
								<input type="hidden" name="field" value="abholung" />
								<Label>Abholung (Rückgabe)</Label>
								<div class="flex gap-2">
									<select name="userId" class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
										<option value="">— Nicht zugewiesen —</option>
										{#each users as u}
											<option value={u.id} selected={u.id === res.assignedUserAbholungId}>{u.username}</option>
										{/each}
									</select>
									<Button type="submit" variant="outline" size="sm">Setzen</Button>
								</div>
							</form>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>

		<!-- Items Tab -->
		<Tabs.Content value="items">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Ausleih-Items</Card.Title>
					<p class="text-sm text-muted-foreground">
						{totalZurueck} / {totalBeantragt} zurückgebracht
					</p>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Item</Table.Head>
								<Table.Head>Beantragt</Table.Head>
								<Table.Head>Genehmigt</Table.Head>
								<Table.Head>Zurück</Table.Head>
								{#if canEditGenehmigt || canReturn}
									<Table.Head>Aktion</Table.Head>
								{/if}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each res.AusleiheItems as ai (ai.id)}
								<Table.Row class={ai.genehmigt > 0 ? "bg-green-50 dark:bg-green-950" : ""}>
									<Table.Cell>
										<div>
											<span class="font-medium">{ai.item.articleName}</span>
											<span class="ml-2 text-xs text-muted-foreground">{ai.item.id}</span>
										</div>
									</Table.Cell>
									<Table.Cell>{ai.beantragt}</Table.Cell>
									<Table.Cell>
										{#if ai.genehmigt > 0}
											<Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{ai.genehmigt}</Badge>
										{:else}
											<span class="text-muted-foreground">0</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										{#if ai.zurueckgebracht > 0}
											<Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{ai.zurueckgebracht}</Badge>
										{:else}
											<span class="text-muted-foreground">0</span>
										{/if}
									</Table.Cell>
									{#if canEditGenehmigt}
										<Table.Cell>
											<form method="POST" action="?/approveItem" use:enhance={handleEnhance} class="flex items-center gap-2">
												<input type="hidden" name="ausleiheItemId" value={ai.id} />
												<Input name="genehmigt" type="number" value={ai.genehmigt || ai.beantragt} min="0" max={ai.beantragt} class="w-20" />
												<Button type="submit" variant="outline" size="sm">Setzen</Button>
											</form>
										</Table.Cell>
									{:else if canReturn}
										<Table.Cell>
											<form method="POST" action="?/returnItem" use:enhance={handleEnhance} class="flex items-center gap-2">
												<input type="hidden" name="ausleiheItemId" value={ai.id} />
												<Input name="zurueckgebracht" type="number" value={ai.genehmigt} min="0" max={ai.genehmigt} class="w-20" />
												<Button type="submit" variant="outline" size="sm">Zurück</Button>
											</form>
										</Table.Cell>
									{/if}
								</Table.Row>
							{/each}
							{#if res.AusleiheItems.length === 0}
								<Table.Row>
									<Table.Cell colspan={5} class="text-center text-muted-foreground py-8">
										Keine Items in dieser Ausleihe
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>

					{#if canApprove}
						<Separator class="my-4" />
						<form method="POST" action="?/approveReservation" use:enhance={handleEnhance} class="flex justify-end">
							<Button type="submit" class="bg-green-600 hover:bg-green-700">Ausleihe genehmigen</Button>
						</form>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Edit Tab -->
		<Tabs.Content value="edit">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Antrag bearbeiten</Card.Title>
					<p class="text-sm text-muted-foreground">
						Änderungen werden sofort übernommen. Der Antragsteller wird per E-Mail informiert
						und alles wird protokolliert.
					</p>
				</Card.Header>
				<Card.Content>
					{#if !isEditable}
						<p class="text-sm text-muted-foreground">
							Dieser Antrag ist im Status <strong>{res.ausleihStatus}</strong> nicht mehr
							editierbar.
						</p>
					{:else}
						<form method="POST" action="?/adminEdit" use:enhance={handleEnhance} class="space-y-6">
							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="adm_phone">Telefon</Label>
									<Input id="adm_phone" name="phone" value={res.phone ?? ""} />
								</div>
								<div class="space-y-2">
									<Label for="adm_verwendungsort">Verwendungsort</Label>
									<Input id="adm_verwendungsort" name="verwendungsort" value={res.verwendungsort ?? ""} />
								</div>
								<div class="md:col-span-2 space-y-2">
									<Label for="adm_reason">Verwendungszweck</Label>
									<Textarea id="adm_reason" name="reason" value={res.reason} class="min-h-[60px]" />
								</div>
								<div class="space-y-2">
									<Label for="adm_startDate">Start (Ausleihe)</Label>
									<Input id="adm_startDate" name="startDate" type="date" value={res.startDate} />
								</div>
								<div class="space-y-2">
									<Label for="adm_endDate">Ende (Ausleihe)</Label>
									<Input id="adm_endDate" name="endDate" type="date" value={res.endDate} />
								</div>
								<div class="space-y-2">
									<Label for="adm_verwendungsStart">Start (Verwendung)</Label>
									<Input id="adm_verwendungsStart" name="verwendungsStart" type="date" value={res.verwendungsStart ?? ""} />
								</div>
								<div class="space-y-2">
									<Label for="adm_verwendungsEnd">Ende (Verwendung)</Label>
									<Input id="adm_verwendungsEnd" name="verwendungsEnd" type="date" value={res.verwendungsEnd ?? ""} />
								</div>
							</div>

							<Separator />

							<div>
								<p class="mb-2 text-sm font-semibold">Beantragte Mengen</p>
								<p class="mb-2 text-xs text-muted-foreground">
									Menge 0 entfernt den Gegenstand aus der Ausleihe.
								</p>
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Item</Table.Head>
											<Table.Head class="w-32 text-center">Beantragt</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each res.AusleiheItems as ai (ai.id)}
											<Table.Row>
												<Table.Cell>
													<span class="font-medium">{ai.item.articleName}</span>
													<span class="ml-2 text-xs text-muted-foreground">{ai.item.bezeichnung}</span>
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
							</div>

							<Separator />

							<div class="space-y-3">
								<p class="text-sm font-semibold">Neue Gegenstände hinzufügen</p>
								<p class="text-xs text-muted-foreground">
									Es werden nur Gegenstände angezeigt, die für den Ausleihertyp des Antragstellers ({res.email}) verfügbar sind.
								</p>

								{#if admPickedNew.length > 0}
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
												{#each admPickedNew as p (p.itemId)}
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
																on:click={() => admRemovePickedNew(p.itemId)}
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
									<Label for="adm_itemSearch">Gegenstand suchen</Label>
									<Input
										id="adm_itemSearch"
										bind:value={admSearch}
										placeholder="Name, Bezeichnung oder Inventarnummer..."
									/>
									{#if admSearch}
										<div class="max-h-64 overflow-y-auto rounded-md border">
											{#if admFilteredAddable.length === 0}
												<p class="p-3 text-sm text-muted-foreground">Keine Treffer.</p>
											{:else}
												{#each admFilteredAddable as item (item.id)}
													<button
														type="button"
														class="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm hover:bg-accent last:border-b-0"
														on:click={() => admAddItem(item)}
													>
														<span>
															<span class="font-medium">{item.articleName}</span>
															<span class="ml-2 text-xs text-muted-foreground">{item.bezeichnung}</span>
														</span>
														<span class="text-xs text-muted-foreground">+ Hinzufügen</span>
													</button>
												{/each}
											{/if}
										</div>
									{/if}
								</div>
							</div>

							<Separator />

							<div class="space-y-2">
								<Label for="adm_adminNote">Notiz für den Antragsteller (optional)</Label>
								<Textarea
									id="adm_adminNote"
									name="adminNote"
									placeholder="Diese Notiz wird in der Info-E-Mail an den Antragsteller mitgeschickt."
									class="min-h-[60px]"
								/>
							</div>

							<div class="flex justify-end">
								<Button type="submit">Änderung übernehmen &amp; E-Mail senden</Button>
							</div>
						</form>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- History Tab -->
		<Tabs.Content value="history">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Änderungsverlauf</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if changeLogs.length === 0}
						<p class="py-8 text-center text-sm text-muted-foreground">Keine Änderungen protokolliert.</p>
					{:else}
						{#each changeLogs as log (log.id)}
							<div class="rounded-lg border p-4 text-sm
								{log.status === 'PENDING' ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-950/30' : ''}
								{log.status === 'SUPERSEDED' || log.status === 'CANCELLED' ? 'opacity-60' : ''}">
								<div class="flex items-center justify-between text-xs text-muted-foreground">
									<div class="flex items-center gap-2">
										<Badge variant="outline">{sourceLabels[log.source] || log.source}</Badge>
										<span class="font-medium text-foreground">{log.actorName}</span>
										<Badge variant="secondary">{logStatusLabels[log.status] || log.status}</Badge>
									</div>
									<span>{new Date(log.timestamp).toLocaleString("de-DE")}</span>
								</div>
								<div class="mt-3 space-y-1">
									{#each changeEntries(log.changes) as ch}
										<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
											<span class="font-medium">{ch.label}</span>
											<span class="text-muted-foreground line-through">{ch.oldValue ?? '—'}</span>
											<span class="text-green-700 dark:text-green-300">{ch.newValue ?? '—'}</span>
										</div>
									{/each}
								</div>
								{#if log.adminNote}
									<div class="mt-3 rounded border-l-2 border-blue-400 bg-blue-50/50 p-2 text-xs dark:border-blue-600 dark:bg-blue-950/30">
										<span class="font-semibold">Admin-Notiz:</span> {log.adminNote}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Comments Tab -->
		<Tabs.Content value="comments">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Kommentare</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Add Comment Form -->
					<form
						method="POST"
						action="?/addComment"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === "success") {
									commentContent = "";
									await invalidateAll();
								}
							};
						}}
						class="space-y-3 rounded-lg border p-4"
					>
						<Textarea
							name="content"
							bind:value={commentContent}
							placeholder="Neuen Kommentar schreiben..."
							class="min-h-[80px]"
						/>
						<div class="flex items-center justify-between">
							<label class="flex items-center gap-2 text-sm">
								<input type="checkbox" name="hidden" bind:checked={commentHidden} class="rounded" />
								Intern (nicht sichtbar für Antragsteller)
							</label>
							<Button type="submit" size="sm">Kommentar hinzufügen</Button>
						</div>
					</form>

					<Separator />

					<!-- Comments List -->
					<div class="space-y-3">
						{#each res.AusleiheComments as comment (comment.id)}
							<div class="rounded-lg border p-4 {comment.hidden ? 'border-dashed bg-muted/30' : ''}">
								<div class="flex items-center justify-between text-xs text-muted-foreground">
									<div class="flex items-center gap-2">
										<span class="font-medium text-foreground">{comment.author}</span>
										{#if comment.hidden}
											<Badge variant="outline" class="text-xs">Intern</Badge>
										{/if}
									</div>
									<span>{new Date(comment.timestamp).toLocaleString("de-DE")}</span>
								</div>
								<p class="mt-2 text-sm">{comment.content}</p>
							</div>
						{/each}
						{#if res.AusleiheComments.length === 0}
							<p class="py-8 text-center text-sm text-muted-foreground">Noch keine Kommentare</p>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
