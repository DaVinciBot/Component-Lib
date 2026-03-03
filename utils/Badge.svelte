<script lang="ts">
	/** @type {{text: string, color: string, className?: string}} */
	let { text, color, className = '' } = $props();

	const badgeStyle: () => string = $derived(() =>
		color ? `--badge-color: var(--color-${color});` : ''
	);
</script>

<span
	class={`badge inline-flex rounded-full border px-2.5 py-1 text-[0.6rem] uppercase ${
		color ? 'badge--colored' : ''
	} ${className}`.trim()}
	style={badgeStyle()}
>
	{text}
</span>

<style>
	.badge {
		border-color: currentColor;
	}

	.badge--colored {
		color: var(--badge-color);
		border-color: color-mix(in srgb, var(--badge-color) 40%, transparent);
		background-color: color-mix(in srgb, var(--badge-color) 15%, transparent);
	}
</style>
