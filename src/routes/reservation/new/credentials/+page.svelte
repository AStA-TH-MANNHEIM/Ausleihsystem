<script lang="ts">
	import { goto } from '$app/navigation';
	import ContentCard from '$lib/components/ContentCard.svelte';
	import NavButtons from '$lib/components/NavButtons.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { reservationStore } from '../(stores)/reservationStore';
	import { credentialsSchema } from '../(schemas)/credentialsSchema';

	export let data;

	$: lenderTypes = data.lenderTypes;

	// Der Ausleihertyp wird automatisch aus der E-Mail-Adresse abgeleitet
	// (LenderTypePattern-Regexe aus der Datenbank).
	$: anyPatterns = lenderTypes.some((lt) => lt.LenderTypePatterns.length > 0);
	$: email = $reservationStore.email;
	$: matchedTypes = !email
		? []
		: lenderTypes.filter((lt) =>
				lt.LenderTypePatterns.some((p) => {
					try {
						return new RegExp(p.pattern).test(email);
					} catch {
						return false;
					}
				})
			);
	$: syncLenderTypeIds(matchedTypes);

	function syncLenderTypeIds(types: typeof lenderTypes) {
		const ids = types.map((lt) => lt.id);
		const current = $reservationStore.lenderTypeIds ?? [];
		if (ids.length !== current.length || ids.some((id, i) => id !== current[i])) {
			$reservationStore.lenderTypeIds = ids;
		}
	}

	$: emailError = (() => {
		if (!$reservationStore.email) return '';
		if (!anyPatterns) return '';
		if (matchedTypes.length === 0) {
			return 'Diese E-Mail-Adresse wurde nicht erkannt. Bitte nutze deine Hochschul-E-Mail-Adresse.';
		}
		return '';
	})();

	let errors: Record<string, string> = {};

	function validate(): boolean {
		errors = {};
		const result = credentialsSchema.safeParse({
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
</script>

<ContentCard classes="max-w-xl">
	<span slot="header">Kontaktdaten</span>

	<div class="space-y-4">
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
				placeholder="vorname.nachname@stud.hs-mannheim.de"
			/>
			{#if errors.email}
				<p class="text-sm text-destructive">{errors.email}</p>
			{:else if emailError}
				<p class="text-sm text-destructive">{emailError}</p>
			{:else if matchedTypes.length > 0}
				<p class="text-sm text-muted-foreground">
					Erkannt als: {matchedTypes.map((lt) => lt.name).join(', ')}
				</p>
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
