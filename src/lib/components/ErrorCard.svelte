<script>
	import { fade } from 'svelte/transition';

	export let message = '';
	export let classes = 'alert variant-filled-error';
</script>

{#if message}
	<aside class={classes} transition:fade={{ duration: 200 }}>
		<div class="alert-message">
			<p>{message}</p>
		</div>
	</aside>
{/if}
