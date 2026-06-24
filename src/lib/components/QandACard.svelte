<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import ContentCard from './ContentCard.svelte';

	export let qAndA: {
		frage: string;
		antwort: string;
		iconUrl: string;
	}[];

	export let title = 'Q&A';
</script>

<ContentCard>
	<div slot="header" class="pb-4">{title}</div>
	<Accordion class="card">
		{#each qAndA as entry}
			<AccordionItem>
				<svelte:fragment slot="lead">{entry.iconUrl}</svelte:fragment>
				<svelte:fragment slot="summary"><h5 class="h5">{entry.frage}</h5></svelte:fragment>
				<svelte:fragment slot="content">{entry.antwort}</svelte:fragment>
			</AccordionItem>
		{/each}
	</Accordion>
</ContentCard>
