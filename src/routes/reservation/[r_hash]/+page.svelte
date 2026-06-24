<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ContentCard from '$lib/components/ContentCard.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { isTerminalState } from '$lib/services/reservationStateService';

	export let data;
	export let form: any;

	$: res = data.reservation;
	$: terminal = isTerminalState(res.ausleihStatus);
	$: canVerify = res.ausleihStatus === 'Angemeldet';
	$: canBook = res.ausleihStatus === 'Reserviert';
	$: canCancel =
		!terminal &&
		res.ausleihStatus !== 'ImGange';
	$: changeLogs = data.changeLogs ?? [];
	$: activePending = data.activePending;
	$: isEditable = data.isEditable;

	const sourceLabels: Record<string, string> = { USER: 'Du', ADMIN: 'Ausleihteam' };
	const logStatusLabels: Record<string, string> = {
		PENDING: 'Wartet auf deine Bestätigung',
		APPLIED: 'Übernommen',
		SUPERSEDED: 'Durch neuere ersetzt',
		CANCELLED: 'Abgebrochen'
	};

	type ChangeEntry = { label: string; oldValue: string | number | null; newValue: string | number | null };
	function changeEntries(raw: unknown): ChangeEntry[] {
		return Array.isArray(raw) ? (raw as ChangeEntry[]) : [];
	}

	function formatDate(d: string) {
		if (!d) return '\u2014';
		return d;
	}

	function handleEnhance() {
		return async () => {
			await invalidateAll();
		};
	}

	// Status timeline
	const statusSteps = ['Angemeldet', 'Verifiziert', 'Reserviert', 'Gebucht', 'ImGange', 'Abgeschlossen'];
	const statusLabels: Record<string, string> = {
		Angemeldet: 'Angemeldet',
		Verifiziert: 'Warten auf Genehmigung',
		Reserviert: 'Reserviert',
		Gebucht: 'Bereit zur Abholung',
		ImGange: 'Im Gange',
		Abgeschlossen: 'Abgeschlossen',
		AbgeschlUnvollst: 'Unvollständig',
		Storniert: 'Storniert'
	};
	const statusOrder: Record<string, number> = {
		Angemeldet: 0, Verifiziert: 1, Reserviert: 2, Gebucht: 3, ImGange: 4, Abgeschlossen: 5
	};

	$: currentStepIndex = statusOrder[res.ausleihStatus] ?? -1;
</script>

<ContentCard classes="max-w-3xl">
	<span slot="header">Ausleihantrag</span>

	<div class="space-y-6">
		{#if form?.error}
			<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
				{form.error}
			</div>
		{/if}

		<!-- Status -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-lg font-semibold">{res.vorname} {res.nachname}</span>
				<StatusChip status={res.ausleihStatus} />
			</div>
		</div>

		<!-- Status Timeline -->
		{#if !terminal || res.ausleihStatus === 'Abgeschlossen'}
			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center justify-between">
						{#each statusSteps as step, i}
							<div class="flex flex-col items-center gap-1">
								<div
									class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
									{i <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}"
								>
									{i + 1}
								</div>
								<span class="hidden text-xs sm:block {i <= currentStepIndex ? 'font-medium' : 'text-muted-foreground'}">
									{statusLabels[step]}
								</span>
							</div>
							{#if i < statusSteps.length - 1}
								<div class="mx-1 mb-5 flex-1">
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
					<StatusChip status={res.ausleihStatus} />
					<p class="mt-2 text-sm text-muted-foreground">Diese Ausleihe wurde beendet.</p>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Pending change banner -->
		{#if activePending}
			<Card.Root class="border-yellow-300 bg-yellow-50/60 dark:border-yellow-700 dark:bg-yellow-950/40">
				<Card.Content class="pt-6 space-y-3">
					<p class="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
						Du hast eine Änderung vorgeschlagen, die noch nicht bestätigt ist.
					</p>
					<p class="text-xs text-yellow-800 dark:text-yellow-200">
						Bitte prüfe dein E-Mail-Postfach – darin findest du den Bestätigungs-Link.
						Solange du nicht bestätigst, bleibt dein Antrag unverändert.
					</p>
					<form method="POST" action="?/cancelPendingChange" use:enhance={handleEnhance}>
						<input type="hidden" name="logId" value={activePending.id} />
						<Button type="submit" size="sm" variant="outline">
							Vorschlag verwerfen
						</Button>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Info status messages -->
		{#if canVerify}
			<div class="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
				Bitte verifiziere deinen Antrag, um den Ausleihprozess fortzusetzen.
			</div>
		{:else if res.ausleihStatus === 'Verifiziert'}
			<div class="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
				Dein Antrag wird geprüft. Du wirst benachrichtigt, sobald er bearbeitet wurde.
			</div>
		{:else if canBook}
			<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
				Dein Antrag wurde genehmigt. Bitte bestätige die Buchung.
			</div>
		{/if}

		<!-- Contact Info -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-lg">Kontaktdaten</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<span class="text-muted-foreground">Name:</span>
					<span class="font-medium">{res.vorname} {res.nachname}</span>
					<span class="text-muted-foreground">E-Mail:</span>
					<span>{res.email}</span>
					<span class="text-muted-foreground">Telefon:</span>
					<span>{res.phone || '\u2014'}</span>
					<span class="text-muted-foreground">Verwendungszweck:</span>
					<span>{res.reason}</span>
					{#if res.verwendungsort}
						<span class="text-muted-foreground">Verwendungsort:</span>
						<span>{res.verwendungsort}</span>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Dates -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-lg">Zeitraum</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ausleihzeitraum</p>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<span class="text-muted-foreground">Start:</span>
					<span class="font-medium">{formatDate(res.startDate)}</span>
					<span class="text-muted-foreground">Ende:</span>
					<span class="font-medium">{formatDate(res.endDate)}</span>
				</div>
				{#if res.verwendungsStart || res.verwendungsEnd}
					<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verwendungszeitraum</p>
					<div class="grid grid-cols-2 gap-2 text-sm">
						<span class="text-muted-foreground">Start:</span>
						<span class="font-medium">{formatDate(res.verwendungsStart)}</span>
						<span class="text-muted-foreground">Ende:</span>
						<span class="font-medium">{formatDate(res.verwendungsEnd)}</span>
					</div>
				{/if}
				{#if res.abholort}
					<div class="mt-3 grid grid-cols-2 gap-2 text-sm">
						<span class="text-muted-foreground">Abholort:</span>
						<span class="font-medium">{res.abholort}</span>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Items -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-lg">Gegenstände</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Gegenstand</Table.Head>
							<Table.Head class="text-center">Beantragt</Table.Head>
							<Table.Head class="text-center">Genehmigt</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each res.AusleiheItems as ai (ai.id)}
							<Table.Row>
								<Table.Cell>
									<span class="font-medium">{ai.item.articleName}</span>
									<span class="ml-2 text-xs text-muted-foreground">{ai.item.bezeichnung}</span>
								</Table.Cell>
								<Table.Cell class="text-center">{ai.beantragt}</Table.Cell>
								<Table.Cell class="text-center">
									{#if ai.genehmigt > 0}
										<Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
											{ai.genehmigt}
										</Badge>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Public Comments -->
		{#if res.AusleiheComments.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Kommentare</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#each res.AusleiheComments as comment (comment.id)}
						<div class="rounded-lg border p-4">
							<div class="flex items-center justify-between text-xs text-muted-foreground">
								<span class="font-medium text-foreground">{comment.author}</span>
								<span>{new Date(comment.timestamp).toLocaleString('de-DE')}</span>
							</div>
							<p class="mt-2 text-sm">{comment.content}</p>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Action Buttons -->
		{#if canVerify || canBook || canCancel || isEditable}
			<Separator />
			<div class="flex flex-wrap gap-3">
				{#if canVerify}
					<form method="POST" action="?/verify" use:enhance={handleEnhance}>
						<Button type="submit" class="bg-green-600 hover:bg-green-700">
							E-Mail verifizieren
						</Button>
					</form>
				{/if}

				{#if canBook}
					<form method="POST" action="?/book" use:enhance={handleEnhance}>
						<Button type="submit" class="bg-blue-600 hover:bg-blue-700">
							Buchung bestätigen
						</Button>
					</form>
				{/if}

				{#if isEditable}
					<a
						href={`/reservation/${res.id}/edit`}
						class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						Antrag bearbeiten
					</a>
				{/if}

				{#if canCancel}
					<form method="POST" action="?/cancel" use:enhance={handleEnhance}>
						<Button type="submit" variant="destructive">
							Stornieren
						</Button>
					</form>
				{/if}
			</div>
		{/if}

		<!-- Änderungsverlauf -->
		{#if changeLogs.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Änderungsverlauf</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#each changeLogs as log (log.id)}
						<div
							class="rounded-lg border p-3 text-sm
								{log.status === 'PENDING'
								? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-950/30'
								: ''}
								{log.status === 'SUPERSEDED' || log.status === 'CANCELLED' ? 'opacity-60' : ''}"
						>
							<div class="flex items-center justify-between text-xs text-muted-foreground">
								<div class="flex items-center gap-2">
									<Badge variant="outline">{sourceLabels[log.source] || log.source}</Badge>
									<Badge variant="secondary">{logStatusLabels[log.status] || log.status}</Badge>
								</div>
								<span>{new Date(log.timestamp).toLocaleString('de-DE')}</span>
							</div>
							<div class="mt-2 space-y-1">
								{#each changeEntries(log.changes) as ch}
									<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
										<span class="font-medium">{ch.label}</span>
										<span class="text-muted-foreground line-through">{ch.oldValue ?? '—'}</span>
										<span class="text-green-700 dark:text-green-300">{ch.newValue ?? '—'}</span>
									</div>
								{/each}
							</div>
							{#if log.adminNote}
								<div class="mt-2 rounded border-l-2 border-blue-400 bg-blue-50/50 p-2 text-xs dark:border-blue-600 dark:bg-blue-950/30">
									<span class="font-semibold">Notiz vom Ausleihteam:</span> {log.adminNote}
								</div>
							{/if}
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</ContentCard>
