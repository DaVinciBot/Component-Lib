<script lang="ts">
	type SpinnerProps = {
		divClass?: string;
		text: string;
	};

	let { divClass = '', text }: SpinnerProps = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 {divClass}">
	<div
		class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs tracking-[0.28em] uppercase"
	>
		<span class="spinner" aria-hidden="true"></span>
		<span class="text-center">{text}</span>
	</div>
</div>

<style>
	.spinner {
		width: 22px;
		height: 22px;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 9999px;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
