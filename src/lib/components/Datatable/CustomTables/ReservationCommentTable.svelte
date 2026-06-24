<script lang="ts">
	//Import local datatable components
	import ThSort from '$lib/components/Datatable/ThSort.svelte';
	import ThFilter from '$lib/components/Datatable/ThFilter.svelte';
	import Search from '$lib/components/Datatable/Search.svelte';
	import RowsPerPage from '$lib/components/Datatable/RowsPerPage.svelte';
	import RowCount from '$lib/components/Datatable/RowCount.svelte';
	import Pagination from '$lib/components/Datatable/Pagination.svelte';
	  import { onMount } from 'svelte';
	import { getModalStore, type ModalSettings, type ModalComponent } from '@skeletonlabs/skeleton';
	import ModalReservationCommentForm from '$lib/components/Forms/ModalReservationCommentForm.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { AusleiheComment } from '$lib/generated/zod';
	import { reservationCommentTableStore } from './stores/reservationCommentTableStore';
	import { logger } from '$lib/logger';


	//Load local data
	export let tableData: AusleiheComment[];
	export let ausleiheId: string;
	export let isForAdmin: boolean = false;

	//Import handler from SSD
	import { DataHandler } from '@vincjo/datatables';

	//Init data handler - CLIENT
	const handler = new DataHandler<AusleiheComment>(tableData, { rowsPerPage: 5 });
	const rows = handler.getRows();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	function emptyComment(ausleiheId: string) {
		return {
			ausleiheId: ausleiheId,
			author: isForAdmin ? "admin" : "user",
			content: '',
			hidden: isForAdmin,
		};
	}

	function receiveFormResponse(responseObject: any) {
		if (responseObject.responseStatus === 200) {
			sessionStorage.setItem('show-toast', 'Comment created');
			document.dispatchEvent(
				new CustomEvent('reload', {
					detail: { }, 
					bubbles: true
				})
			);
		} else {
			toastStore.trigger({ message: responseObject.responseData.message, background: 'variant-filled-error' });
		}
	}


	// function triggerModal(ausleiheComment: AusleiheComment, isNewItem: boolean){
	function triggerModal(ausleiheComment: any, isNew: boolean){
			const comp_ref: ModalComponent = { ref: ModalReservationCommentForm };
			const modal: ModalSettings = {
				type: 'component',
				component: comp_ref,
				meta: {
					ausleiheId: ausleiheComment.ausleiheId,
					ausleiheComment: ausleiheComment,
					isNew: isNew,
					isEditable: isNew,
					isForAdmin: isForAdmin
				},
				response: (r) => receiveFormResponse(r)
			};
			modalStore.trigger(modal);
		}

		onMount(() => {
			//logger.debug("store.search: ", $reservationCommentTableStore.search);
			//logger.debug("reset search");
			reservationCommentTableStore.setSearch("");
			//logger.debug("store.search: ", $reservationCommentTableStore.search);
		});


</script>

<div class="space-y-4 overflow-x-auto">
	<!-- Header -->
	<header class="flex justify-between gap-4 pb-4">
		<Search {handler} tableStore={reservationCommentTableStore}/>
		<div class="flex justify-between gap-4 items-center">
			<RowsPerPage {handler} />

		</div>
	</header>
	<!-- Table -->
	<table class="table table-hover table-compact w-full table-auto">
		<thead>
			<tr>
				<th> ID </th>
				<th> content </th>
				<th> timestamp </th>
				{#if isForAdmin}
					<th> author </th>
					<th> login </th>
					<th> hidden </th>
				{/if}
				<th class="w-1 pr-10"></th>
			</tr>
		</thead>
		<tbody>
			{#each $rows as row}
				<tr>
					<td>
						<button
							type="button"
							class="underline"
							on:click={() => triggerModal(row, false)}
						>
							{row.id}
						</button>
					</td>
					<td>{row.content}</td>
					<td>{row.timestampString}</td>
					{#if isForAdmin}
						<td>{row.author}</td>
						<td>{row.login}</td>
						<td>{row.hidden} 
							{#if row.hidden}
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M10.585 10.587a2 2 0 0 0 2.829 2.828"/><path d="M16.681 16.673A8.7 8.7 0 0 1 12 18q-5.4 0-9-6q1.908-3.18 4.32-4.674m2.86-1.146A9 9 0 0 1 12 6q5.4 0 9 6q-1 1.665-2.138 2.87M3 3l18 18"/></g></svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/><path d="M21 12q-3.6 6-9 6t-9-6q3.6-6 9-6t9 6"/></g></svg>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	<!-- Footer -->
	<footer class="flex justify-between pt-4">
		<RowCount {handler} />
		<Pagination {handler} tableStore={reservationCommentTableStore}/>
	</footer>
	<div class="flex flex-row-reverse pt-6">
		<button
			type="button"
			class="btn variant-outline-tertiary hover:variant-soft-primary"
			on:click={() => triggerModal(emptyComment(ausleiheId), true)}
		>
			Kommentar hinzufügen
		</button>
	</div>
</div>
