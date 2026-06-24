<script lang="ts">
	import { cn } from "$lib/utils";
	let className: string | undefined = undefined;
	export { className as class };
</script>

<tfoot class={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...$$restProps}>
	<slot />
</tfoot>
