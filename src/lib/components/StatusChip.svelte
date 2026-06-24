<script lang="ts">
	
	import { AusleihStatusSchema, type AusleihStatusType } from '$lib/generated/zod';
	const AusleihStatus = AusleihStatusSchema.Enum;
	
	import { logger } from '$lib/logger';

	export let status: AusleihStatusType;
	export let overdue: boolean = false;
	export let isForAdmin: boolean = false;

	const statusLabels: Record<string, string> = {
		Angemeldet: "Angemeldet",
		Verifiziert: "Warten auf Genehmigung",
		Reserviert: "Reserviert",
		Gebucht: "Bereit zur Abholung",
		ImGange: "Im Gange",
		Abgeschlossen: "Abgeschlossen",
		AbgeschlUnvollst: "Unvollständig",
		Storniert: "Storniert",
	};

	//logger.debug("StatusChip,  status: ", status, ", overdue: ", overdue, " , isForAdmin: ", isForAdmin);

	$: variantColor = () => {
		if (status == AusleihStatus.Angemeldet) {
			return 'variant-glass-warning';
		} else if (status == AusleihStatus.Verifiziert) {
			return 'variant-filled-success';
		} else if (status == AusleihStatus.Reserviert) {
			return 'variant-glass-primary';
		} else if (status == AusleihStatus.Gebucht) {
			return 'variant-glass-success';
		} else if (status == AusleihStatus.ImGange) {
			return 'variant-filled';
		} else if (status == AusleihStatus.Abgeschlossen) {
			return 'variant-outline-success';
		} else if (status == AusleihStatus.Storniert) {
			return 'variant-outline-warning';
		} else if (status == AusleihStatus.AbgeschlUnvollst) {
			return 'variant-outline-error';
		} else {
			return 'variant-filled-error';
		}
	};

	$: callForAction = () => {
		if(overdue) {
			if (status == AusleihStatus.ImGange) {
				return "✋🗓️❗️"
			}
		};
		if(isForAdmin) {
			if (status == AusleihStatus.Verifiziert || status == AusleihStatus.Gebucht || status == AusleihStatus.ImGange) {
				return "✋";
			};
		};
		return "";
	};
</script>

<div class="{variantColor()} badge">{statusLabels[status] || status}</div>
{callForAction()}
