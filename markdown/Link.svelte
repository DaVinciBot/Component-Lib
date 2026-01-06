<script>
	/** @type {{href?: string, title?: any, children?: import('svelte').Snippet}} */
	let { href = '', title = undefined, children } = $props();
</script>

<a
	{href}
	{title}
	target="_blank"
	rel="noopener noreferrer"
	class="text-blue-400 hover:text-blue-300 underline"
>
	{@render children?.()}
	{#if !children}
		{title}
	{/if}
</a>
