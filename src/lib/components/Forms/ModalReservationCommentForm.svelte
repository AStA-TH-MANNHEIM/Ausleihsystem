<script lang="ts">
	import LabelWrapper from '$lib/components/Forms/LabelWrapper.svelte';
	import {
		type AusleiheComment,
		AusleiheCommentSchema,
	} from '$lib/generated/zod/index.js';
	import { type ZodIssue, ZodError } from 'zod';
	import { onMount, SvelteComponent } from 'svelte';
	import { enhance } from '$app/forms';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { logger } from '$lib/logger';

	export let parent: SvelteComponent;	

	const modalStore = getModalStore();

	let form: AusleiheComment = $modalStore[0].meta.ausleiheComment;
	const isNew: boolean = $modalStore[0].meta.isNew;
	const isEditable: boolean = $modalStore[0].meta.isEditable;
	const isForAdmin: boolean = $modalStore[0].meta.isForAdmin || false;
	let saveDisabled: boolean = false;

	//Tailwind klassen
	// const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-none';
	const cGrid = 'grid grid-cols-3 gap-4';
	// const cGrid = '';

	//Errorhinweise
	let hinweismeldung: ZodIssue | null;

	const validateForm = () => {
		if(!form.content || form.content.length === 0) {
			saveDisabled = true
		} else {
			saveDisabled = false
		}

	};

	async function onFormSubmit() {
		let response;
		try {
			if (isNew) {
				logger.debug("creating comment", form);
				const fetchAddress = isForAdmin ? '/api/reservation/comment' : '/api/reservation/usercomment';
				response = await fetch(fetchAddress, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(form)
				});
			} else {
				// That should not happen
				logger.error("AusleiheComment cannot be changed!");
			}
			const data = await response.json();
			console.log("data: ", data);
			if ($modalStore[0].response) {
				$modalStore[0].response({ausleiheComment: form, isNewItem: isNew, responseStatus: response.status, responseData: data, isForAdmin: isForAdmin} );
			} else {
				logger.debug("no response callback configured...");
			}
		} catch(error) {
			logger.error("error: ", error);
			if ($modalStore[0].response) {
				$modalStore[0].response({ausleiheComment: form, isNewItem: isNew, responseStatus: "500", responseData: { message: "unknown error" }, isForAdmin: isForAdmin} );
			} else {
				logger.debug("no response callback configured...");
			}
		}
		modalStore.close();
	}

	onMount(async () => {
		logger.debug("ModalRerverationCommentForm mounted");
		if (form.timestamp) 
			// form.timestampString = form.timestamp.toISOString().split('T')[0];
			form.timestampString = form.timestamp.toISOString().slice(0,16);
		validateForm();
	});
</script>

<div class="card p-4 w-modal shadow-xl space-y-4'">

	<h3 class="h3 pb-1">Kommentar zur Ausleihe</h3>

	<form method="POST" class={cForm} use:enhance on:input={validateForm}>

	<hr class="!border-t-2" />

	{#if isForAdmin}
	<div class={cGrid}>

			<div>
				<p class="pb-2">Generated</p>
				<input
					type="text"
					name="author"
					value={form.author}
					class="input"
					disabled={true}
				/>
			</div>
	
			<div>
				<p class="pb-2">Hidden</p>
				<select name="hidden" bind:value={form.hidden} class="input" disabled={!isEditable}>
					<option value={false}>false
					</option>
					<option value={true}>true
					</option>
				</select>
				{#if form.hidden}
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M10.585 10.587a2 2 0 0 0 2.829 2.828"/><path d="M16.681 16.673A8.7 8.7 0 0 1 12 18q-5.4 0-9-6q1.908-3.18 4.32-4.674m2.86-1.146A9 9 0 0 1 12 6q5.4 0 9 6q-1 1.665-2.138 2.87M3 3l18 18"/></g></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/><path d="M21 12q-3.6 6-9 6t-9-6q3.6-6 9-6t9 6"/></g></svg>
				{/if}
			</div>
		</div>
	
		<hr class="!border-t-2" />

	{:else}
		<input type="hidden" name="hidden" value="false">
	{/if}

	<div>
		<p>Comment</p>
		<textarea name="content" bind:value={form.content} class="input rounded-none" rows="6" disabled={!isEditable}/>
	</div>

	<hr class="!border-t-2" />

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