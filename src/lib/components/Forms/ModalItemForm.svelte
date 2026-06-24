<script lang="ts">
	import LabelWrapper from '$lib/components/Forms/LabelWrapper.svelte';
	import {
		type Standort,
		ItemSchema,
		ItemStatusSchema,
		type Item
	} from '$lib/generated/zod/index.js';
	import { type ZodIssue, ZodError } from 'zod';
	import { onMount, SvelteComponent } from 'svelte';
	import { enhance } from '$app/forms';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { logger } from '$lib/logger';

	export let parent: SvelteComponent;	

	const modalStore = getModalStore();

	let standorte: Standort[] = [];
	let form: Item = $modalStore[0].meta.item;
	const isNew: boolean = $modalStore[0].meta.isNew;
	const isEditable: boolean = $modalStore[0].meta.isEditable;
	let saveDisabled: boolean = true;

	const getLocations = async () => {
		try {
			const response = await fetch('/api/location');
			const locations = await response.json();
			const standorte: Standort[] = locations.standorte;

			if (standorte) {
				return standorte.sort((a: Standort, b: Standort) => a.standort.localeCompare(b.standort));
			} else {
				logger.error('Standorte konnten nicht geladen werden');
				return [];
			}
		} catch (error) {
			logger.error('Fehler beim Laden der Standorte:', error);
			return [];
		}
	};

	//Tailwind klassen
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
	const cGrid = 'grid grid-cols-1 md:grid-cols-2 gap-4';
	// const cGrid = '';

	//Errorhinweise
	let hinweismeldung: ZodIssue | null;

	const validateForm = () => {
		// console.log('validateForm');
		hinweismeldung = null;

		try {
			ItemSchema.parse(form);
			saveDisabled = false;
		} catch (e) {
			if (e instanceof ZodError) {
				hinweismeldung = e.issues[0];
				saveDisabled = true;
			} else {
				logger.error("Unexpected validation error:", e);
			}	
		}
	};

	//Datumformatierung
	let kaufdatumFormatted = formatDateToInput(form.kaufdatum);

	// Funktion, um das Datum ins `YYYY-MM-DD` Format zu konvertieren
	function formatDateToInput(dateString: Date): string {
		if (!dateString) return new Date().toISOString().split('T')[0];
		return new Date(dateString).toISOString().split('T')[0];
	}

	function updateKaufdatum() {
		form.kaufdatum = new Date(kaufdatumFormatted);
	}

	async function onFormSubmit() {
				let response;
		if (isNew) {
			//Creating new Item
			response = await fetch('/api/item', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});
		} else {
			//TODO change Item endpoint aufrufen
			response = await fetch('/api/item/' + form.id, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});
		}
		const data = await response.json();
		if ($modalStore[0].response) $modalStore[0].response({item: form, isNewItem: isNew, responseStatus: response.status, responseData: data} );
		modalStore.close();
		logger.debug("data: ", data);
	}

	onMount(async () => {
		standorte = standorte.length != 0 ? standorte : await getLocations();
		// logger.debug("modalStore: ", JSON.stringify($modalStore[0].meta));
		validateForm();
	});
</script>

<div class="card p-4 w-modal shadow-xl space-y-4'">


	<!--
	<form method="POST"  use:enhance on:input={validateForm}>
	<form method="POST" class="space-y-4 p-4 max-w-md mx-auto" use:enhance on:input={validateForm}>
	-->

	<form method="POST" class={cForm} use:enhance on:input={validateForm}>
		<div class={cGrid}>
			<LabelWrapper label="ID" name="id" {hinweismeldung}>
				{#if isNew}
					<input type="text" name="id" bind:value={form.id} class="input" />
				{:else}
					<input type="text" name="id" value={form.id} class="input" disabled={true} />
				{/if}
			</LabelWrapper>

			<LabelWrapper label="Name" name="articleName" {hinweismeldung}>
				<input type="text" name="articleName" bind:value={form.articleName} class="input" disabled={!isEditable}/>
			</LabelWrapper>
		</div>

		<LabelWrapper label="Bezeichnung" name="bezeichnung" {hinweismeldung}>
			<input type="text" name="bezeichnung" bind:value={form.bezeichnung} class="input" disabled={!isEditable}/>
		</LabelWrapper>

	<hr class="!border-t-2" />

	<div class={cGrid}>
		<LabelWrapper label="Kaufpreis (Euro Cent)" name="kaufpreis" {hinweismeldung}>
			<input type="number" name="kaufpreis" bind:value={form.kaufpreis} class="input" disabled={!isEditable}/>
		</LabelWrapper>

		<LabelWrapper label="Kaufdatum" name="kaufdatum" {hinweismeldung}>
			<input
				type="date"
				name="kaufdatum"
				bind:value={kaufdatumFormatted}
				class="input"
				on:input={updateKaufdatum}
				disabled={!isEditable}	
			/>
		</LabelWrapper>
	</div>

	<hr class="!border-t-2" />

	<div class={cGrid}>
		<LabelWrapper label="Anzahl" name="quantity" {hinweismeldung}>
			<input type="number" name="quantity" bind:value={form.quantity} class="input" disabled={!isEditable}	
			/>
		</LabelWrapper>

		<LabelWrapper label="Standort" name="standortId" {hinweismeldung}>
			<select name="standort" bind:value={form.standortId} class="input" disabled={!isEditable}>
				{#each standorte as option}
					<option value={option.id}>{option.standort}</option>
				{/each}
			</select>
		</LabelWrapper>
	</div>

	<LabelWrapper label="Beschreibung" name="description" {hinweismeldung}>
		<textarea name="description" bind:value={form.description} class="input" disabled={!isEditable}	
			/>
	</LabelWrapper>

	<hr class="!border-t-2" />

	<div class={cGrid}>
		<LabelWrapper label="Status" name="itemStatus" {hinweismeldung}>
			<select name="itemStatus" bind:value={form.itemStatus} class="input" disabled={!isEditable}>
				{#each Object.values(ItemStatusSchema.Enum) as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</LabelWrapper>

	</div>
</form>

		<footer class="modal-footer {parent.regionFooter} pt-4">
			<button class="btn {parent.buttonNeutral}" on:click={() => modalStore.close()}
				>{parent.buttonTextCancel}</button
			>
			{#if isEditable}
				<button class="btn {parent.buttonPositive}" on:click={onFormSubmit} disabled={saveDisabled}
					>{parent.buttonTextSubmit}</button
				>
			{/if}
		</footer>
	
	</div>