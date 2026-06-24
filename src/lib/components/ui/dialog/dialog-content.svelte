<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn, flyAndScale } from "$lib/utils";
	import DialogOverlay from "./dialog-overlay.svelte";
	import DialogPortal from "./dialog-portal.svelte";

	type $$Props = DialogPrimitive.ContentProps;

	let className: $$Props["class"] = undefined;
	export let transition = flyAndScale;
	export let transitionConfig = { duration: 200 };
	export { className as class };
</script>

<DialogPortal>
	<DialogOverlay />
	<DialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full",
			className
		)}
		{...$$restProps}
	>
		<slot />
	</DialogPrimitive.Content>
</DialogPortal>
