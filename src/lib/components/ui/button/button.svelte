<script lang="ts">
	import { cn } from "$lib/utils";
	import { buttonVariants, type Props, type Events } from ".";

	type $$Props = Props;
	type $$Events = Events;

	let className: $$Props["class"] = undefined;
	export let variant: $$Props["variant"] = "default";
	export let size: $$Props["size"] = "default";
	/** Ist href gesetzt, wird ein <a> statt eines <button> gerendert. */
	export let href: $$Props["href"] = undefined;
	export { className as class };
</script>

{#if href}
	<a
		{href}
		class={cn(buttonVariants({ variant, size, className }))}
		on:click
		{...$$restProps}
	>
		<slot />
	</a>
{:else}
	<button
		class={cn(buttonVariants({ variant, size, className }))}
		on:click
		{...$$restProps}
	>
		<slot />
	</button>
{/if}
