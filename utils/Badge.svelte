<script lang="ts">
	/** @type {{text: string, color: string, className?: string}} */
	let { text, color, className = '' } = $props();

	const colorClasses: string = $derived(`border-${color}/40 bg-${color}/15 text-${color}`);
</script>

<span
	class={`inline-flex rounded-full border px-2.5 py-1 text-[0.6rem] uppercase ${colorClasses} ${className}`.trim()}
>
	{text}
</span>
