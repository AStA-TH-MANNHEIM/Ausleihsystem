<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { cn } from "$lib/utils";

	export let status: string;

	const statusConfig: Record<string, { label: string; classes: string }> = {
		Verfuegbar: { label: "Verfügbar", classes: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900" },
		Defekt: { label: "Defekt", classes: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-800 dark:hover:bg-red-900" },
		Gesperrt: { label: "Gesperrt", classes: "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800" },
		Verloren: { label: "Verloren", classes: "bg-red-200 text-red-900 border-red-300 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800 dark:hover:bg-red-900" },
		WartungErforderlich: { label: "Wartung", classes: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800 dark:hover:bg-yellow-900" },
		Aussortiert: { label: "Aussortiert", classes: "bg-gray-300 text-gray-600 border-gray-400 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800" },
	};

	$: config = statusConfig[status] || { label: status, classes: "bg-gray-100 text-gray-700" };
</script>

<Badge variant="outline" class={cn(config.classes)}>
	{config.label}
</Badge>
