<script lang="ts">
	import type { DataHandler } from '@vincjo/datatables';
	import type { Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { logger } from '$lib/logger';


	export let handler: DataHandler;
	//export let value: string;
	export let tableStore: Writable;

	$: if ($tableStore.search !== undefined) {
		handler.search($tableStore.search);
	}

	onMount(() => {
		handler.setPage($tableStore.page);
	});

</script>

<input
	class="input w-36 sm:w-64"
	type="search"
	placeholder="Search..."
	bind:value={$tableStore.search}
/>
