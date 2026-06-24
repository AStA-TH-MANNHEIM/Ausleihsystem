<script>
	export let classes = 'max-w-lg';
	export let variant = 'variant-ghost';
</script>

<div class="space-y-4">
	<div class="text-center">
		<slot name="lead"></slot>
	</div>
	<div class="card container space-y-4 p-4 shadow-lg {variant} {classes} ">
		<h3 class="h3 text-center">
			<slot name="header"></slot>
		</h3>
		<slot></slot>
	</div>
</div>

<style>
	.container {
		margin: 0 auto;
	}
</style>
