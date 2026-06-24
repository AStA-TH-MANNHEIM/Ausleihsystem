<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const steps = [
		{ label: 'Kontaktdaten', path: '/reservation/new/credentials' },
		{ label: 'Datum', path: '/reservation/new/dates' },
		{ label: 'Gegenstände', path: '/reservation/new/items' }
	];

	$: currentPath = $page.url.pathname;
	$: currentStepIndex = steps.findIndex((s) => currentPath.startsWith(s.path));

	function navigateToStep(index: number) {
		if (index < currentStepIndex) {
			goto(steps[index].path);
		}
	}
</script>

<div class="mx-auto w-full max-w-4xl px-4 py-6">
	<!-- Step Indicator -->
	<div class="mb-8 flex items-center justify-center">
		{#each steps as step, i}
			<button
				class="flex flex-col items-center {i < currentStepIndex ? 'cursor-pointer' : 'cursor-default'}"
				on:click={() => navigateToStep(i)}
				disabled={i >= currentStepIndex}
			>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors
					{i <= currentStepIndex
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}
					{i < currentStepIndex ? 'hover:bg-primary/80' : ''}"
				>
					{i + 1}
				</div>
				<span
					class="mt-1 text-xs
					{i <= currentStepIndex ? 'font-medium text-foreground' : 'text-muted-foreground'}"
				>
					{step.label}
				</span>
			</button>
			{#if i < steps.length - 1}
				<div class="mx-3 mb-5 h-0.5 w-16 {i < currentStepIndex ? 'bg-primary' : 'bg-muted'}"></div>
			{/if}
		{/each}
	</div>

	<slot />
</div>
