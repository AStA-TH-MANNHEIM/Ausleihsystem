<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	$: queryParams = $page.url.searchParams;
	$: selected = queryParams.get('selector')?.toLowerCase() || 'relevant';

	export let options = ['Relevant', 'Alle', 'Alt'];

	const handleChange = async (e: Event) => {
		const target = e.target;
		if (!(target instanceof HTMLSelectElement)) return;
		const selectedValue = target.value.toLowerCase();
		await goto(`?selector=${selectedValue}`, { replaceState: true });
		location.reload();
	};
</script>

<aside class="flex place-items-center">
	Anzeigen:
	<select class="select ml-2" on:change={handleChange} bind:value={selected}>
		{#each options as option}
			<option value={option.toLowerCase()}>
				{option}
			</option>
		{/each}
	</select>
</aside>
