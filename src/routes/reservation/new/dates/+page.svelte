<script lang="ts">
	import { goto } from '$app/navigation';
	import ContentCard from '$lib/components/ContentCard.svelte';
	import NavButtons from '$lib/components/NavButtons.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { reservationStore } from '../(stores)/reservationStore';
	import { dateSchema, getMinStartDate, getTodayDate } from '../(schemas)/dateSchema';

	$: minStart = getMinStartDate();
	$: minSelectableDate = getTodayDate();
	$: isShortNotice =
		!!$reservationStore.startDate &&
		$reservationStore.startDate < minStart &&
		$reservationStore.startDate >= minSelectableDate;

	let errors: Record<string, string> = {};

	function validate(): boolean {
		errors = {};
		const result = dateSchema.safeParse({
			startDate: $reservationStore.startDate,
			endDate: $reservationStore.endDate,
			verwendungsStart: $reservationStore.verwendungsStart,
			verwendungsEnd: $reservationStore.verwendungsEnd
		});

		if (!result.success) {
			for (const issue of result.error.issues) {
				const key = issue.path[0] as string;
				if (!errors[key]) errors[key] = issue.message;
			}
			return false;
		}
		return true;
	}

	function handleNext() {
		if (validate()) {
			const params = new URLSearchParams({
				lenderTypeIds: ($reservationStore.lenderTypeIds ?? []).join(','),
				startDate: $reservationStore.startDate,
				endDate: $reservationStore.endDate
			});
			goto(`/reservation/new/items?${params.toString()}`);
		}
	}

	function handleBack() {
		goto('/reservation/new/credentials');
	}
</script>

<ContentCard classes="max-w-xl">
	<span slot="header">Datum</span>

	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">
			Bitte melde Ausleihen nach Moeglichkeit 2 Wochen im Voraus an. Kurzfristige Ausleihen sind weiterhin moeglich.
		</p>
		{#if isShortNotice}
			<p class="text-sm text-amber-700">
				Hinweis: Diese Ausleihe ist kurzfristig angemeldet und wird individuell geprueft.
			</p>
		{/if}

		<!-- Ausleihzeitraum -->
		<div class="space-y-2">
			<p class="text-sm font-semibold">Ausleihzeitraum</p>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="startDate">Startdatum</Label>
					<Input
						id="startDate"
						type="date"
						bind:value={$reservationStore.startDate}
						min={minSelectableDate}
					/>
					{#if errors.startDate}
						<p class="text-sm text-destructive">{errors.startDate}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="endDate">Enddatum</Label>
					<Input
						id="endDate"
						type="date"
						bind:value={$reservationStore.endDate}
						min={$reservationStore.startDate || minSelectableDate}
					/>
					{#if errors.endDate}
						<p class="text-sm text-destructive">{errors.endDate}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Verwendungszeitraum -->
		<div class="space-y-2">
			<p class="text-sm font-semibold">Verwendungszeitraum (optional)</p>
			<p class="text-xs text-muted-foreground">
				Falls der Zeitraum der tatsächlichen Nutzung vom Ausleihzeitraum abweicht.
			</p>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="verwendungsStart">Start</Label>
					<Input
						id="verwendungsStart"
						type="date"
						bind:value={$reservationStore.verwendungsStart}
						min={$reservationStore.startDate}
					/>
					{#if errors.verwendungsStart}
						<p class="text-sm text-destructive">{errors.verwendungsStart}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="verwendungsEnd">Ende</Label>
					<Input
						id="verwendungsEnd"
						type="date"
						bind:value={$reservationStore.verwendungsEnd}
						max={$reservationStore.endDate}
					/>
					{#if errors.verwendungsEnd}
						<p class="text-sm text-destructive">{errors.verwendungsEnd}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="mt-6">
		<NavButtons
			show_b1={true}
			b1_lable="Zurück"
			b1_function={handleBack}
			show_b2={true}
			b2_lable="Weiter"
			b2_function={handleNext}
		/>
	</div>
</ContentCard>
