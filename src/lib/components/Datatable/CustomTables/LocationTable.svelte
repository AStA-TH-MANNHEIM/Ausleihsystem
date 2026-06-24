<script lang="ts">
	//Import local datatable components
	import ThSort from '$lib/components/Datatable/ThSort.svelte';
	import Search from '$lib/components/Datatable/Search.svelte';
	import RowsPerPage from '$lib/components/Datatable/RowsPerPage.svelte';
	import RowCount from '$lib/components/Datatable/RowCount.svelte';
	import Pagination from '$lib/components/Datatable/Pagination.svelte';
	import { locationTableStore } from './stores/locationTableStore';

	//Import types
	import type { Standort } from '$lib/generated/zod';

	//Load local data
	export let tableData: Standort[] = [];
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export let updateStandort: (_: Standort) => void = () => {};
	let editID = -1;

	//Import handler from SSD
	import { DataHandler } from '@vincjo/datatables';

	//Init data handler - CLIENT
	const handler = new DataHandler(tableData, { rowsPerPage: 5 });
	const rows = handler.getRows();
</script>

<div class="space-y-4 overflow-x-auto">
	<!-- Header -->
	<header class="flex justify-between gap-4">
		<Search {handler} tableStore={locationTableStore}/>
		<RowsPerPage {handler} />
	</header>
	<!-- Table -->
	<table class="table table-hover table-compact w-full table-auto">
		<thead>
			<tr>
				<ThSort {handler} orderBy="standort" tableStore={locationTableStore}>Standort</ThSort>
				<ThSort {handler} orderBy="id" tableStore={locationTableStore}>ID</ThSort>
				<th class="w-1 pr-10"></th>
			</tr>
		</thead>
		<tbody>
			{#each $rows as row}
				<tr>
					{#if editID == row.id}
						<td
							><input
								class="input-sm input w-36 sm:w-64"
								type="text"
								bind:value={row.standort}
							/></td
						>
						<td>{row.id}</td>
						<td class="w-1">
							<div class="flex justify-end space-x-4 pr-4">
								<button
									class="variant-filled-warning btn btn-sm"
									on:click={() => {
										editID = -1;
										updateStandort(row);
									}}>Speichern</button
								>
								<button class="variant-filled btn btn-sm" on:click={() => (editID = -1)}
									>Abbrechen</button
								>
							</div>
						</td>
					{:else}
						<td>{row.standort}</td>
						<td>{row.id}</td>
						<td class="w-1">
							<div class="flex justify-end pr-4">
								<button class="variant-ghost btn btn-sm" on:click={() => (editID = row.id)}
									>Bearbeiten</button
								>
							</div>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	<!-- Footer -->
	<footer class="flex justify-between">
		<RowCount {handler} />
		<Pagination {handler} tableStore={locationTableStore}/>
	</footer>
</div>
