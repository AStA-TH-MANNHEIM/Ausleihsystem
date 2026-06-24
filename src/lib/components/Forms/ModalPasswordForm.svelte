<script lang="ts">
	import LabelWrapper from '$lib/components/Forms/LabelWrapper.svelte';
	import { type ZodIssue, ZodError, ZodIssueCode } from 'zod';
	import { onMount, SvelteComponent } from 'svelte';
	import { enhance } from '$app/forms';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { logger } from '$lib/logger';

	export let parent: SvelteComponent;	

	const modalStore = getModalStore();

	let form: object = $modalStore[0].meta.passwordData;

	let saveDisabled: boolean = true;

	//Tailwind klassen
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
	const cGrid = 'grid grid-cols-1 md:grid-cols-2 gap-4';
	// const cGrid = '';

	//Errorhinweise
	let hinweismeldung: ZodIssue | null;

	const validateForm = () => {
		hinweismeldung = null;

		if (form.password.length < 7) {
            //hinweismeldung?.message = 'Password must be at least 7 characters.';
            hinweismeldung = {
				code: ZodIssueCode.custom,
				message: 'Password too weak',
				path: ['password'],
			};
			return;
        }
        if (form.password !== form.confirmPassword) {
            //hinweismeldung?.message = 'Passwords do not match.';
            hinweismeldung = {
				code: ZodIssueCode.custom,
				message: 'Passwords do not match',
				path: ['password'],
			};
            return;
        }
		saveDisabled = false;
	};


	async function onFormSubmit() {
		logger.debug("onFormSubmit updatePassword: *******");

		try {
			const response = await fetch('/api/user/password', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ password: form.password })
			});
			logger.debug("Response object: ", response);
	
			if (!response.ok) {
				logger.error(`Request failed: ${response.status}`);
				const currentModal = $modalStore[0];
				if (currentModal?.response) {
					currentModal.response({ responseStatus: response.status });
				} else {
					logger.error("No response callback configured");
				}
				return;
			}
	
			const data = await response.json();
	
			const currentModal = $modalStore[0];
			if (currentModal?.response) {
				logger.debug("Response data: ", data);
				currentModal.response({ responseStatus: response.status, responseData: data });
			} else {
				logger.error("No response callback configured");
			}
		} catch (err) {
			logger.error("Error during fetch:", err);
		} finally {
			modalStore.close();
		}
	}

	onMount(async () => {
		validateForm();
	});

</script>


<div class="card p-4 w-modal shadow-xl space-y-4'">

	<form method="POST" class={cForm} use:enhance on:input={validateForm}>
		<div class={cGrid}>
			<LabelWrapper label="Passwort" name="password" {hinweismeldung}>
				<input type="password" name="password" bind:value={form.password} class="input" />
			</LabelWrapper>
			<LabelWrapper label="Passwort bestätigen" name="confirmPassword" {hinweismeldung}>
				<input type="password" name="confirmPassword" bind:value={form.confirmPassword} class="input" />
			</LabelWrapper>
		</div>

	</form>

		<footer class="modal-footer {parent.regionFooter} pt-4">
			<button class="btn {parent.buttonNeutral}" on:click={() => modalStore.close()}
				>{parent.buttonTextCancel}</button
			>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit} disabled={saveDisabled}
				>{parent.buttonTextSubmit}</button
			>
		</footer>
	
</div>