<script lang="ts">
	import { logger } from '$lib/logger';
	import type { DataHandler } from '@vincjo/datatables';
	import type { Writable, get } from 'svelte/store';

	export let handler: DataHandler;
	export let orderBy: string;
	export let tableStore: Writable;

	const sorted = handler.getSort();

	function handleSortChange() {
		if ($sorted.identifier) {
			tableStore.updateSort($sorted.identifier, $sorted.direction); 
		}
  	}

	$: if ($tableStore.sortBy === orderBy) {
			if ($tableStore.sortBy !== undefined) {
				//logger.debug("$tableStore.sortBy:", $tableStore.sortBy);
				//logger.debug("$tableStore.sortOrder:", $tableStore.sortOrder);
				if($tableStore.sortOrder === "asc") {
					handler.sortAsc($tableStore.sortBy);
				} else {
					handler.sortDesc($tableStore.sortBy);
				}
			}
		}
</script>

<!--
<th on:click={() => {handler.sort(orderBy) ; handleSortChange()}} class="cursor-pointer select-none">
-->
<th on:click={() => {tableStore.updateSortBy(orderBy); tableStore.updateSortOrder(($sorted.direction === 'asc') ? 'desc' : 'asc' )}} class="cursor-pointer select-none">
	<div class="flex h-full items-center justify-start gap-x-2" class:px-2={$sorted.identifier === orderBy && $sorted.direction } class:variant-outline-primary={$sorted.identifier === orderBy && $sorted.direction }>
		<slot />
		{#if $sorted.identifier === orderBy}
			{#if $sorted.direction === 'asc'}
				&darr;
			{:else if $sorted.direction === 'desc'}
				&uarr;
			{/if}
		{:else}
			&updownarrow;
		{/if}
	</div>
</th>
