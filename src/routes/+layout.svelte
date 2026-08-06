<script lang="ts">
	import { onMount } from 'svelte';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup, initializeStores, Toast, getToastStore, Modal } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';

	import '$lib/i18n';

	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';

	import userStore from '$lib/stores/userStore';

	$: isAdmin = $page.url.pathname.startsWith('/admin');

	import '../app.postcss';

	export let data;

	initializeStores();
	const toastStore = getToastStore();

	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	userStore.set({
		username: data.user || ''
	});

	onMount(() => {
		// Dark mode wird bereits vor dem Rendern in app.html initialisiert.

		document.addEventListener('reload', (event) => {
			console.log("Special reload event!");
			const customEvent = event as CustomEvent;
			event.stopPropagation();
			location.reload();
		});

		const showToast = sessionStorage.getItem('show-toast');
		if(showToast) {
			toastStore.trigger({ message: showToast, background: 'variant-filled-success' });
			sessionStorage.removeItem('show-toast');
		}
	});
</script>


{#if isAdmin}
	<div class="h-screen bg-background text-foreground">
		<Modal></Modal>
		<slot></slot>
		<Toast></Toast>
	</div>
{:else}
	<div class="flex min-h-screen flex-col bg-background text-foreground">
		<Modal></Modal>

		<Header />

		<main class="mx-auto w-full max-w-7xl flex-grow px-4 py-6">
			<slot></slot>
		</main>

		<Toast></Toast>

		<Footer />
	</div>
{/if}
