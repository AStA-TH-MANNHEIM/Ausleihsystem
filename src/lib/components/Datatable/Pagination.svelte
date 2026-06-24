<script lang="ts">
	import type { DataHandler } from '@vincjo/datatables';
	import { logger } from '$lib/logger';
	import type { Readable, Writable, get } from 'svelte/store';
	export let handler: DataHandler;
	export let tableStore: Writable;
	const pageNumber = handler.getPageNumber();
	const pageCount = handler.getPageCount();
	const pages = handler.getPages({ ellipsis: true });

	$: if ($tableStore.page !== undefined) {
		handler.setPage($tableStore.page);
	}
</script>

<!-- Desktop buttons -->
 <!--
<section class="variant-ghost-surface btn-group hidden h-10 lg:block [&>*+*]:border-surface-500">
-->
<section class="btn-group variant-outline">
	<button
		type="button"
		class="hover:variant-soft-primary"
		disabled={$pageNumber === 1}
		on:click={() => ( tableStore.updatePage($pageNumber-1))}
	>
		←
	</button>
	{#each $pages as page}
		<button
			type="button"
			class={` 
				${$pageNumber === page
				? 'variant-outline-secondary'
				: 'active:variant-outline hover:variant-soft-primary'
				}
				${page === null ? 'ellipse' : ''}
			`}
			on:click={() => (  tableStore.updatePage(page))}
		>
			{page ?? '...'}
		</button>
	{/each}
	<button
		type="button"
		class="hover:variant-soft-primary"
		disabled={$pageNumber === $pageCount}
		on:click={() => ( tableStore.updatePage($pageNumber+1))}
	>
		→
	</button>
</section>

<!-- Mobile buttons 
<section class="lg:hidden">
	<button
		type="button"
		class="variant-ghost-surface btn mb-2 mr-2 hover:variant-soft-primary"
		class:disabled={$pageNumber === 1}
		on:click={() => handler.setPage('previous')}
	>
	</button>
	<button
		type="button"
		class="variant-ghost-surface btn mb-2 hover:variant-soft-primary"
		class:disabled={$pageNumber === $pageCount}
		on:click={() => handler.setPage('next')}
	>
	</button>
</section>
-->
