<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { cn } from "$lib/utils";

	export let status: string;

	const statusConfig: Record<string, { label: string; classes: string }> = {
		Angemeldet: { label: "Angemeldet", classes: "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800" },
		Verifiziert: { label: "Warten auf Genehmigung", classes: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900" },
		Reserviert: { label: "Reserviert", classes: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800 dark:hover:bg-yellow-900" },
		Gebucht: { label: "Bereit zur Abholung", classes: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800 dark:hover:bg-orange-900" },
		ImGange: { label: "Im Gange", classes: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800 dark:hover:bg-purple-900" },
		Abgeschlossen: { label: "Abgeschlossen", classes: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900" },
		AbgeschlUnvollst: { label: "Unvollständig", classes: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-800 dark:hover:bg-red-900" },
		Storniert: { label: "Storniert", classes: "bg-red-200 text-red-900 border-red-300 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800 dark:hover:bg-red-900" },
	};

	$: config = statusConfig[status] || { label: status, classes: "bg-gray-100 text-gray-700" };
</script>

<Badge variant="outline" class={cn(config.classes)}>
	{config.label}
</Badge>
