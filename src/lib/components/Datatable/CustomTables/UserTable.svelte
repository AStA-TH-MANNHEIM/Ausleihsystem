<script lang="ts">
	//Import local datatable components
	import ThSort from '$lib/components/Datatable/ThSort.svelte';
	import Search from '$lib/components/Datatable/Search.svelte';
	import RowsPerPage from '$lib/components/Datatable/RowsPerPage.svelte';
	import RowCount from '$lib/components/Datatable/RowCount.svelte';
	import Pagination from '$lib/components/Datatable/Pagination.svelte';
	import { userTableStore } from './stores/userTableStore';
	import { logger } from '$lib/logger';

	//Import types
	import type { User } from '$lib/generated/zod';
	type UserTr = Omit<User, 'passwordHash'>;

	//Load local data
	export let tableData: UserTr[] = [];
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export let deleteUser: (id: string) => void = () => {};
	export let updateUser: (_: User) => void = () => {};

	let editID = '-1';

	//Import handler from SSD
	import { DataHandler } from '@vincjo/datatables';

	//Init data handler - CLIENT
	const handler = new DataHandler(tableData, { rowsPerPage: 5 });
	const rows = handler.getRows();
</script>

<div class="space-y-4 overflow-x-auto">
	<!-- Header -->
	<header class="flex justify-between gap-4">
		<Search {handler} tableStore={userTableStore}/>
		<RowsPerPage {handler} />
	</header>
	<!-- Table -->
	<table class="table table-hover table-compact w-full table-auto">
		<thead>
			<tr>
				<ThSort {handler} orderBy="username" tableStore={userTableStore}>Name</ThSort>
				<ThSort {handler} orderBy="email" tableStore={userTableStore}>Email</ThSort>
				<th class="w-1 pr-10"></th>
			</tr>
		</thead>
		<tbody>
			{#each $rows as row}
				<tr>
					<td>{row.username}</td>
					{#if editID == row.id}
						<td>
							<input
								class="input-sm input w-36 sm:w-64"
								type="text"
								bind:value={row.email}
							/>
						</td>
						<td class="w-1">
							<div class="flex justify-end space-x-4 pr-4">
								<button
									class="variant-filled-warning btn btn-sm"
									on:click={() => {
										editID = '-1';
										updateUser(row);
									}}>Speichern</button
								>
								<button class="variant-filled btn btn-sm" on:click={() => (editID = '-1')}
									>Abbrechen</button
								>
							</div>
						</td>
					{:else}
						<td>{row.email}</td>
						<td class="w-1">
							<div class="flex justify-end pr-2 gap-x-2">
								<button
									class="variant-filled-warning btn btn-sm"
									on:click={() => {
										editID = '-1';
										logger.debug("calling deleteUser with ", row.id);
										deleteUser(row.id);
									}}
									disabled={row.protected}>Löschen</button
								>
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
		<Pagination {handler} tableStore={userTableStore}/>
	</footer>
</div>
