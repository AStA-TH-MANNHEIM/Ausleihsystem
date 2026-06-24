<script lang="ts">
	//Import local datatable components
	import ThSort from '$lib/components/Datatable/ThSort.svelte';
	import ThFilter from '$lib/components/Datatable/ThFilter.svelte';
	import Search from '$lib/components/Datatable/Search.svelte';
	import RowsPerPage from '$lib/components/Datatable/RowsPerPage.svelte';
	import RowCount from '$lib/components/Datatable/RowCount.svelte';
	import Pagination from '$lib/components/Datatable/Pagination.svelte';

	//Load local data
	export let tableData;

	let entryLinkBase = 'reservations/';

	//Import handler from SSD
	import { DataHandler } from '@vincjo/datatables';
	import StatusChip from '../../StatusChip.svelte';
	import SelectParameter from './../SelectParameter.svelte';

	import { reservationTableStore } from './stores/reservationTableStore';
	import type { Ausleihe } from '$lib/generated/zod';

	// Check if stored sort needs migration (fix old 'timestamp' default)
	let currentState;
	reservationTableStore.subscribe(state => currentState = state)();
	if (currentState.sortBy === 'timestamp') {
		reservationTableStore.updateSortBy('startDate');
	}

	//Init data handler - CLIENT
	const handler = new DataHandler(tableData, { rowsPerPage: 20 });
	const rows = handler.getRows();

	// Set default sort by startDate descending (newest first)
	handler.sortDesc('startDate');


	function overdue(ausleihe: Ausleihe) {
		const now = new Date();
		let checkDate = new Date(ausleihe.endDate);
		return checkDate < now;
	}

</script>

<div class="space-y-4 overflow-x-auto">
	<!-- Header -->
	<header class="flex justify-between gap-4">
		<Search {handler} tableStore={reservationTableStore}/>
		<div class="flex justify-between gap-4">
			<SelectParameter />
			<RowsPerPage {handler} />
		</div>
	</header>
	<!-- Table -->
	<table class="table table-hover table-compact w-full table-auto">
		<thead>
			<tr>
				<ThSort {handler} orderBy="id" tableStore={reservationTableStore}>ID</ThSort>
				<ThSort {handler} orderBy="assignedUserAusgabeId" tableStore={reservationTableStore}>Betreuer Ausgabe</ThSort>
				<ThSort {handler} orderBy="email" tableStore={reservationTableStore}>email</ThSort>
				<ThSort {handler} orderBy="ausleihStatus" tableStore={reservationTableStore}>ausleihStatus</ThSort>
				<ThSort {handler} orderBy="startDate" tableStore={reservationTableStore}>Verwendungszeitraum von</ThSort>
				<ThSort {handler} orderBy="endDate" tableStore={reservationTableStore}>Verwendungszeitraum bis</ThSort>
				<ThSort {handler} orderBy="vorname" tableStore={reservationTableStore}>vorname</ThSort>
				<ThSort {handler} orderBy="nachname" tableStore={reservationTableStore}>nachname</ThSort>
				<ThSort {handler} orderBy="timestamp" tableStore={reservationTableStore}>timestamp</ThSort>
				<th class="w-1 pr-10"></th>
			</tr>
			<tr>
				<ThFilter {handler} filterBy="id"/>
				<ThFilter {handler} filterBy="assignedUserAusgabeId"/>
				<ThFilter {handler} filterBy="email"/>
				<ThFilter {handler} filterBy="ausleihStatus"/>
				<ThFilter {handler} filterBy="startDate"/>
				<ThFilter {handler} filterBy="endDate"/>
				<ThFilter {handler} filterBy="vorname"/>
				<ThFilter {handler} filterBy="nachname"/>
				<ThFilter {handler} filterBy="timestampString"/>
				<th class="w-1 pr-10"></th>
			</tr>
		</thead>
		<tbody>
			{#each $rows as row}
				<tr>
					<td>
						<a class="btn underline" href={entryLinkBase + row.id}>
							{row.id}
						</a></td>
					<td>{row.assignedUserAusgabeId}</td>
					<td>{row.email}</td>
					<td><StatusChip status={row.ausleihStatus} overdue={overdue(row)} isForAdmin={true}/></td>
					<td>{row.startDate}</td>
					<td>{row.endDate}</td>
					<td>{row.vorname}</td>
					<td>{row.nachname}</td>
					<td>{row.timestampString}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<!-- Footer -->
	<footer class="flex justify-between">
		<RowCount {handler} />
		<Pagination {handler} tableStore={reservationTableStore}/>
	</footer>
</div>
