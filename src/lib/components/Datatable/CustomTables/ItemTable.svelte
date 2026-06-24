<script lang="ts">
	//Import local datatable components
	import ThSort from '$lib/components/Datatable/ThSort.svelte';
	import ThFilter from '$lib/components/Datatable/ThFilter.svelte';
	import Search from '$lib/components/Datatable/Search.svelte';
	import RowsPerPage from '$lib/components/Datatable/RowsPerPage.svelte';
	import RowCount from '$lib/components/Datatable/RowCount.svelte';
	import Pagination from '$lib/components/Datatable/Pagination.svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { getModalStore, type ModalSettings, type ModalComponent } from '@skeletonlabs/skeleton';
	import ModalItemForm from '$lib/components/Forms/ModalItemForm.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { Item } from '$lib/generated/zod';
	import { logger } from '$lib/logger';
	import { itemTableStore } from './stores/itemTableStore';
	import Icon from '@iconify/svelte';

	type Tag = { id: number; name: string };
	type ItemWithTags = Item & { tags?: Tag[] };

	//Load local data
	export let tableData: ItemWithTags[];
	export let allTags: Tag[] = [];

	//Import handler from SSD
	import { DataHandler } from '@vincjo/datatables';
	import SelectParameter from './../SelectParameter.svelte';

	// Tag filter state
	let selectedTagIds: Set<number> = new Set();

	function toggleTag(tagId: number) {
		if (selectedTagIds.has(tagId)) {
			selectedTagIds.delete(tagId);
		} else {
			selectedTagIds.add(tagId);
		}
		selectedTagIds = selectedTagIds; // trigger reactivity
	}

	function clearTagFilter() {
		selectedTagIds = new Set();
	}

	// Reactive filtered data based on selected tags
	$: tagFilteredData = selectedTagIds.size === 0
		? tableData
		: tableData.filter((item) =>
			item.tags?.some((tag) => selectedTagIds.has(tag.id)) ?? false
		);

	//Init data handler - CLIENT (reactive based on filtered data)
	$: handler = new DataHandler<ItemWithTags>(tagFilteredData, { rowsPerPage: 5 });
	$: rows = handler.getRows();

	let searchValue = "";

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	function emptyItem(): Item {
		return {
			id: '',
			articleName: '',
			bezeichnung: '',
			kaufdatum: new Date(),
			kaufpreis: 0,
			description: '',
			quantity: 0,
			itemStatus: 'Verfuegbar',
			standortId: 0
		};
	}

		function receiveFormResponse(result: any) {
				// {item: form, responseStatus: response.status, responseData: data} 
				logger.debug("result: ", result);

				//Entspechenden Toast triggern
			if (result.responseStatus === 200) {
				let item: Item = result.item;
				//toastStore.trigger({ message: data.message, background: 'variant-filled-success' });
				if(result.isNew) {
					sessionStorage.setItem('show-toast', 'Item created');
				} else {
					sessionStorage.setItem('show-toast', 'Item updated');
				}
				//sessionStorage.setItem('itemId', item.id);
				logger.debug("update itemId:", item.id);
				itemTableStore.updateItemId(item.id);
				reloadPage(false);
				modalStore.close();
			} else if (result.responseStatus === 400) {
				toastStore.trigger({ message: result.responseData.message, background: 'variant-filled-warning' });
			} else {
				toastStore.trigger({ message: result.responseData.message, background: 'variant-filled-error' });
			console.error(result.responseData);
			}
		}


		function triggerModal(item: Item, isNew: boolean){
			const comp_ref: ModalComponent = { ref: ModalItemForm };
			const modal: ModalSettings = {
				type: 'component',
				component: comp_ref,
				meta: {
					item: item,
					isNew: isNew,
					isEditable: true
				},
				response: (r) => receiveFormResponse(r)
			};
			modalStore.trigger(modal);
		}

		function reloadPage(resetGui: boolean){
			if(resetGui) {
				//sessionStorage.removeItem("itemId");
				//sessionStorage.removeItem("searchValue");
				//sessionStorage.removeItem("sortIdentifier");
				//sessionStorage.removeItem("sortDirection");
				itemTableStore.reset();
			}
			document.dispatchEvent(
				new CustomEvent('reload', {
					detail: { }, 
					bubbles: true
				})
			);
		}

function goToItemPage(itemId: string) {
	logger.debug("goToItemPage - itemId: ", itemId);
	if (itemId === null) return;
	const rowsStore = handler.getAllRows();
	const rows = get(rowsStore);
	const index = rows.findIndex(item => item.id === itemId);
	if (index === -1) return;

	const pageSize = handler.pageHandler.pageSize ?? 5;
	const page = Math.floor(index / pageSize) + 1;
	//console.log("go to page:", page);
	handler.setPage(page);
}

	onMount(() => {
		//logger.debug("tableData: ", JSON.stringify(tableData));

				const savedItemid = get(itemTableStore).itemId;
				console.log("savedItemid: ", savedItemid);
				if (savedItemid !== null || savedItemid !== '') {
					// sessionStorage.removeItem("itemId");
					// console.log("goToItemPage...");
					logger.debug("goiToItemPage:", savedItemid)
					goToItemPage(savedItemid);
				}
  });


</script>

<div class="space-y-4 overflow-x-auto">
	<!-- Tag Filter -->
	{#if allTags && allTags.length > 0}
		<div class="card p-4 mb-4">
			<div class="flex items-center justify-between mb-2">
				<h3 class="h3 text-base sm:text-lg">Nach Tags filtern</h3>
				{#if selectedTagIds.size > 0}
					<button class="btn btn-sm variant-ghost-surface" on:click={clearTagFilter}>
						<Icon icon="tabler:x" width="1em" height="1em" />
						Filter zurücksetzen
					</button>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				{#each allTags as tag}
					<button
						class="chip {selectedTagIds.has(tag.id) ? 'variant-filled-primary' : 'variant-soft-surface'}"
						on:click={() => toggleTag(tag.id)}
					>
						{tag.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Header -->
	<header class="flex justify-between gap-4 pb-4">
		<Search {handler} tableStore={itemTableStore}/>
		<div class="flex justify-between gap-4 items-center">
			<SelectParameter />
			<RowsPerPage {handler} />
			<button
				class="refresh-link align-middle"
				style="display: inline-flex; align-items: center; gap: 0.5em;"
				on:click={reloadPage}
				>
				Refresh
				<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" class="mr-1 iconify iconify--tabler"
					width="1.5em" height="1.5em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round"
					stroke-linejoin="round" stroke-width="2"
					d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path></svg>
			</button>

		</div>
	</header>
	<!-- Table -->
	<table class="table table-hover table-compact w-full table-auto">
		<thead>
			<tr>
				<ThSort {handler} orderBy="id" tableStore={itemTableStore}>ID</ThSort>
				<ThSort {handler} orderBy="articleName" tableStore={itemTableStore}>ArticleName</ThSort>
				<ThSort {handler} orderBy="bezeichnung" tableStore={itemTableStore}>Bezeichnung</ThSort>
				<ThSort {handler} orderBy="kaufdatum" tableStore={itemTableStore}>Kaufdatum</ThSort>
				<ThSort {handler} orderBy="kaufpreis" tableStore={itemTableStore}>Kaufpreis</ThSort>
				<ThSort {handler} orderBy="description" tableStore={itemTableStore}>Description</ThSort>
				<ThSort {handler} orderBy="quantity" tableStore={itemTableStore}>Quantity</ThSort>
				<ThSort {handler} orderBy="itemStatus" tableStore={itemTableStore}>ItemStatus</ThSort>
					<ThSort {handler} orderBy="standortName" tableStore={itemTableStore}>Standort</ThSort>
				<th>Tags</th>
				<th class="w-1 pr-10"></th>
			</tr>
		</thead>
		<tbody>
			{#each $rows as row}
				<tr>
					<td>
						<a href="/admin/items/{row.id}" class="underline text-primary-500 hover:text-primary-700">
							{row.id}
						</a>
					</td>
					<td>{row.articleName}</td>
					<td>{row.bezeichnung}</td>
					<td>{row.kaufdatumString}</td>
					<td>{(row.kaufpreis / 100).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</td>
					<td>{row.description}</td>
					<td>{row.quantity}</td>
					<td>{row.itemStatus}</td>
						<td>{row.standortName}</td>
					<td>
						<div class="flex flex-wrap gap-1 items-center">
							{#if row.tags && row.tags.length > 0}
								{#each row.tags as tag}
									<span class="badge variant-soft-primary text-xs">{tag.name}</span>
								{/each}
							{/if}
							<a href="/admin/items/{row.id}" class="underline text-xs text-surface-500 hover:text-primary-500 ml-1">
								verwalten
							</a>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<!-- Footer -->
	<footer class="flex justify-between pt-4">
		<RowCount {handler} />
		<Pagination {handler} tableStore={itemTableStore}/>
	</footer>
	<div class="flex flex-row-reverse pt-6">
		<button
			type="button"
			class="btn variant-outline-tertiary hover:variant-soft-primary"
			on:click={() => triggerModal(emptyItem(), true)}
		>
			Item hinzufügen
		</button>
	</div>
</div>
