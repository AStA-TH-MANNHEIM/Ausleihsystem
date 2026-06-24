<script lang="ts">
	import qAndA from './QAndA.json';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';

	let openIndex: number | null = null;

	function toggle(i: number) {
		openIndex = openIndex === i ? null : i;
	}
</script>

<div class="grid grid-cols-1 items-start gap-10 py-12 xl:grid-cols-2">
	<!-- Hero -->
	<div class="flex flex-col items-center space-y-6 text-center xl:items-start xl:text-left">
		<img
			src="/images/Logo/AStA-Logo.svg"
			alt="AStA Logo"
			class="h-[70px] md:h-[86px]"
		/>
		<h1 class="max-w-[600px] text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
			AStA Ausleihsystem
		</h1>

		<p class="max-w-[500px] text-lg text-muted-foreground">
			Mit dem AStA Ausleihsystem kannst du digital Ausleihanträge für das Inventar des
			AStA der Technischen Hochschule Mannheim stellen.
		</p>
		<p class="max-w-[500px] text-muted-foreground">
			Antraege sollten moeglichst 2 Wochen vor dem Event gestellt werden. Kurzfristige Ausleihen sind weiterhin moeglich.
		</p>

		<div class="flex gap-4 pt-2">
			<a href="/reservation/new/credentials">
				<Button size="lg">
					Ausleihe beantragen
					<svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</Button>
			</a>
		</div>
	</div>

	<!-- Q&A -->
	<div class="hidden md:block">
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-2xl">Q&A</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-1">
				{#each qAndA as entry, i}
					{#if i > 0}
						<Separator />
					{/if}
					<button
						class="flex w-full items-center justify-between py-3 text-left text-sm font-medium hover:text-foreground/80 transition-colors"
						on:click={() => toggle(i)}
					>
						<span>{entry.frage}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 shrink-0 text-muted-foreground transition-transform {openIndex === i ? 'rotate-180' : ''}"
							fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if openIndex === i}
						<p class="pb-3 text-sm text-muted-foreground">{entry.antwort}</p>
					{/if}
				{/each}
			</Card.Content>
		</Card.Root>
	</div>
</div>
