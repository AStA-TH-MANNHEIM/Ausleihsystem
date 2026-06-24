<script lang="ts">
	import { goto } from '$app/navigation';
	import ContentCard from '$lib/components/ContentCard.svelte';
	import NavButtons from '$lib/components/NavButtons.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { reservationStore } from '../(stores)/reservationStore';
	import { credentialsSchema } from '../(schemas)/credentialsSchema';

	export let data;

	$: lenderTypes = data.lenderTypes;

	// Default to "Fachschaft" if no lender type selected yet
	$: if ($reservationStore.lenderTypeId === null && lenderTypes.length > 0) {
		const fachschaft = lenderTypes.find((lt) => lt.name === 'Fachschaft');
		$reservationStore.lenderTypeId = fachschaft ? fachschaft.id : lenderTypes[0].id;
	}

	// Local form state bound to store
	$: selectedLenderType = lenderTypes.find((lt) => lt.id === $reservationStore.lenderTypeId);

	// Email validation against LenderType patterns
	$: emailError = (() => {
		if (!$reservationStore.email) return '';
		if (!selectedLenderType) return '';
		const patterns = selectedLenderType.LenderTypePatterns;
		if (patterns.length === 0) return '';
		const matches = patterns.some((p) => {
			try {
				return new RegExp(p.pattern).test($reservationStore.email);
			} catch {
				return false;
			}
		});
		if (!matches) {
			return `Die E-Mail passt nicht zum gewählten Ausleihertyp "${selectedLenderType.name}".`;
		}
		return '';
	})();

	let errors: Record<string, string> = {};

	function validate(): boolean {
		errors = {};
		const result = credentialsSchema.safeParse({
			lenderTypeId: $reservationStore.lenderTypeId,
			vorname: $reservationStore.vorname,
			nachname: $reservationStore.nachname,
			email: $reservationStore.email,
			phone: $reservationStore.phone,
			reason: $reservationStore.reason,
			verwendungsort: $reservationStore.verwendungsort
		});

		if (!result.success) {
			for (const issue of result.error.issues) {
				const key = issue.path[0] as string;
				if (!errors[key]) errors[key] = issue.message;
			}
			return false;
		}

		if (emailError) {
			errors['email'] = emailError;
			return false;
		}

		return true;
	}

	function handleNext() {
		if (validate()) {
			goto('/reservation/new/dates');
		}
	}

	function handleLenderTypeSelect(e: any) {
		if (e?.value !== undefined) {
			$reservationStore.lenderTypeId = e.value;
		}
	}
</script>

<ContentCard classes="max-w-xl">
	<span slot="header">Kontaktdaten</span>

	<div class="space-y-4">
		<!-- LenderType Select -->
		<div class="space-y-2">
			<Label>Ausleihertyp</Label>
			<Select.Root
				selected={selectedLenderType
					? { value: selectedLenderType.id, label: selectedLenderType.name }
					: undefined}
				onSelectedChange={handleLenderTypeSelect}
			>
				<Select.Trigger>
					<Select.Value placeholder="Bitte wählen..." />
				</Select.Trigger>
				<Select.Content>
					{#each lenderTypes as lt (lt.id)}
						<Select.Item value={lt.id} label={lt.name}>
							<div>
								<span>{lt.name}</span>
								{#if lt.description}
									<span class="ml-2 text-xs text-muted-foreground">{lt.description}</span>
								{/if}
							</div>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if errors.lenderTypeId}
				<p class="text-sm text-destructive">{errors.lenderTypeId}</p>
			{/if}
		</div>

		<!-- Name Fields -->
		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label for="vorname">Vorname</Label>
				<Input id="vorname" bind:value={$reservationStore.vorname} placeholder="Max" />
				{#if errors.vorname}
					<p class="text-sm text-destructive">{errors.vorname}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="nachname">Nachname</Label>
				<Input id="nachname" bind:value={$reservationStore.nachname} placeholder="Mustermann" />
				{#if errors.nachname}
					<p class="text-sm text-destructive">{errors.nachname}</p>
				{/if}
			</div>
		</div>

		<!-- Email -->
		<div class="space-y-2">
			<Label for="email">E-Mail</Label>
			<Input
				id="email"
				type="email"
				bind:value={$reservationStore.email}
				placeholder="m.mustermann@stud.hs-mannheim.de"
			/>
			{#if errors.email}
				<p class="text-sm text-destructive">{errors.email}</p>
			{:else if emailError}
				<p class="text-sm text-destructive">{emailError}</p>
			{/if}
		</div>

		<!-- Phone -->
		<div class="space-y-2">
			<Label for="phone">Telefon (optional)</Label>
			<Input id="phone" type="tel" bind:value={$reservationStore.phone} placeholder="+49..." />
		</div>

		<!-- Reason -->
		<div class="space-y-2">
			<Label for="reason">Verwendungszweck</Label>
			<Textarea
				id="reason"
				bind:value={$reservationStore.reason}
				placeholder="Wofür werden die Gegenstände benötigt?"
			/>
			{#if errors.reason}
				<p class="text-sm text-destructive">{errors.reason}</p>
			{/if}
		</div>

		<!-- Verwendungsort -->
		<div class="space-y-2">
			<Label for="verwendungsort">Verwendungsort</Label>
			<Input
				id="verwendungsort"
				bind:value={$reservationStore.verwendungsort}
				placeholder="Wo werden die Gegenstände verwendet?"
			/>
			{#if errors.verwendungsort}
				<p class="text-sm text-destructive">{errors.verwendungsort}</p>
			{/if}
		</div>
	</div>

	<div class="mt-6">
		<NavButtons show_b2={true} b2_lable="Weiter" b2_function={handleNext} />
	</div>
</ContentCard>
