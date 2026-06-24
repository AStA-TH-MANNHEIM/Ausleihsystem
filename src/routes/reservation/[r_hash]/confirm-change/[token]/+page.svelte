<script lang="ts">
	import ContentCard from '$lib/components/ContentCard.svelte';

	export let data;
</script>

<ContentCard classes="max-w-xl">
	<span slot="header">Änderung bestätigen</span>

	<div class="space-y-4">
		{#if data.status === 'confirmed'}
			<div
				class="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
			>
				<p class="font-semibold">Änderung erfolgreich übernommen.</p>
				<p class="mt-1">
					Deine Anpassungen sind nun aktiv. Eine Bestätigungs-E-Mail ist unterwegs.
				</p>
			</div>
		{:else if data.status === 'already_resolved'}
			<div
				class="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
			>
				<p class="font-semibold">Dieser Link ist nicht mehr gültig.</p>
				<p class="mt-1">
					Status der Änderung: <strong>{data.logStatus}</strong>. Möglicherweise wurde sie
					bereits bestätigt, abgebrochen oder durch eine neuere Änderung ersetzt.
				</p>
			</div>
		{/if}

		<a
			href={`/reservation/${data.ausleiheId}`}
			class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Zurück zum Antrag
		</a>
	</div>
</ContentCard>
