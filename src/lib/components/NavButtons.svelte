<script lang="ts">
	export let b1_lable = 'Zurück';
	export let b1_function = () => {
		history.back();
	};
	export let b1_classes = 'variant-ghost';
	export let b1_disabled = false;
	export let show_b1 = false;

	export let b2_lable = 'Weiter';
	export let b2_function = () => {};
	export let b2_classes = 'variant-filled';
	export let b2_disabled = false;
	export let show_b2 = false;
</script>

<div class="buttons flex gap-4">
	{#if show_b1 == true}
		<button
			type="button"
			class="{b1_classes} btn"
			disabled={b1_disabled}
			on:click={b1_function}
			aria_label={b1_lable}
		>
			{b1_lable}
		</button>
	{/if}

	{#if show_b2 == true}
		<button
			type="button"
			class="ml-auto {b2_classes} btn"
			disabled={b2_disabled}
			on:click={b2_function}
			aria_label={b2_lable}
		>
			{b2_lable}
		</button>
	{/if}
</div>

<style>
	.buttons {
		display: flex;
		justify-content: space-between;
	}
</style>
