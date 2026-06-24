<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { cn } from "$lib/utils";

	export let status: string;

	const statusConfig: Record<string, { label: string; classes: string }> = {
		PfandNichtFestgelegt: { label: "Nicht festgelegt", classes: "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800" },
		PfandBezahlt: { label: "Bezahlt", classes: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900" },
		PfandZurueckgegeben: { label: "Zurückgegeben", classes: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900" },
	};

	$: config = statusConfig[status] || { label: status, classes: "bg-gray-100 text-gray-700" };
</script>

<Badge variant="outline" class={cn(config.classes)}>
	{config.label}
</Badge>
