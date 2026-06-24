<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/reservation/new/credentials', { replaceState: true });
	});
</script>
