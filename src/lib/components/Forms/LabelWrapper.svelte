<script lang="ts">
	import type { ZodIssue } from 'zod';

	export let label;
	export let name;
	export let hinweismeldung: ZodIssue | null = null;
</script>

<label class="label" for={name}>
	<span>{label}</span>
	<slot></slot>
	{#if hinweismeldung}
		{#if hinweismeldung.path == name}
			<small class="label-text-alt text-error-500">{hinweismeldung.message}</small>
		{/if}
	{/if}
</label>
