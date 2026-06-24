<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, flyAndScale } from "$lib/utils";

	type $$Props = SelectPrimitive.ContentProps;

	let className: $$Props["class"] = undefined;
	export let sideOffset = 4;
	export let transition = flyAndScale;
	export let transitionConfig = undefined;
	export { className as class };
</script>

<SelectPrimitive.Content
	{transition}
	{transitionConfig}
	{sideOffset}
	class={cn(
		"relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
		className
	)}
	{...$$restProps}
>
	<div class="p-1">
		<slot />
	</div>
</SelectPrimitive.Content>
