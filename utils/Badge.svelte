<script lang="ts">
	/** @type {{text: string, className?: string}} */
	let { text, className = '' } = $props();
</script>

<span
	class={`inline-flex rounded-full border px-2.5 py-1 text-[0.6rem] uppercase ${className}`.trim()}
>
	{text}
</span>
