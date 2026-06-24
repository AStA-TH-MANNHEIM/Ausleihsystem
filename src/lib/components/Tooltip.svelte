<script>
	export let position = 'right';
	//takes top/bottom/left/right
</script>

<div class="tooltip-container">
	<div class="tooltip-trigger">
		<slot name="trigger"></slot>
	</div>
	<div class="tooltip tooltip-{position} card variant-filled p-4" style="white-space: nowrap;">
		<slot name="content"></slot>
	</div>
</div>

<style>
	.tooltip-container {
		position: relative;
		display: inline-block;
	}

	.tooltip-trigger {
		cursor: pointer;
	}

	.tooltip {
		position: absolute;
		z-index: 1;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.3s,
			visibility 0.3s,
			transform 0.3s;
	}

	.tooltip::after {
		content: '';
		position: absolute;
		border-style: solid;
		border-width: 5px;
	}

	.tooltip-top {
		min-width: 120px;
		bottom: calc(100% + 5px);
		left: 50%;
		transform: translateX(-50%) translateY(-10px);
	}

	.tooltip-top::after {
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-color: #333333 transparent transparent transparent;
	}

	.tooltip-bottom {
		top: calc(100% + 5px);
		left: 50%;
		transform: translateX(-50%) translateY(10px);
	}

	.tooltip-bottom::after {
		bottom: 100%;
		left: 50%;
		margin-left: -5px;
		border-color: transparent transparent #333333 transparent;
	}

	.tooltip-left {
		right: calc(100% + 5px);
		top: 50%;
		transform: translateY(-50%) translateX(-10px);
	}

	.tooltip-left::after {
		left: 100%;
		top: 50%;
		margin-top: -5px;
		border-color: transparent transparent transparent #333333;
	}

	.tooltip-right {
		left: calc(100% + 5px);
		top: 50%;
		transform: translateY(-50%) translateX(10px);
	}

	.tooltip-right::after {
		right: 100%;
		top: 50%;
		margin-top: -5px;
		border-color: transparent #333333 transparent transparent;
	}

	.tooltip-container:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
	}

	.tooltip-container:hover .tooltip-left,
	.tooltip-container:hover .tooltip-right {
		transform: translateY(-50%) translateX(0);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
