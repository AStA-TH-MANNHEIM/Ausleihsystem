<script lang="ts">
	import { onMount } from 'svelte';
	import ContentCard from '$lib/components/ContentCard.svelte';
	import { resetReservationStore } from '../(stores)/reservationStore';

	onMount(() => {
		resetReservationStore();
	});
</script>

<ContentCard classes="max-w-lg">
	<span slot="header">Antrag eingereicht</span>

	<div class="space-y-4 text-center">
		<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8 text-green-600 dark:text-green-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<p class="text-sm text-muted-foreground">
			Dein Ausleihantrag wurde erfolgreich eingereicht.
		</p>
		<p class="text-sm text-muted-foreground">
			Bitte überprüfe dein E-Mail-Postfach und klicke auf den Verifizierungslink, um deinen Antrag zu bestätigen.
		</p>

		<a
			href="/"
			class="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Zur Startseite
		</a>
	</div>
</ContentCard>
