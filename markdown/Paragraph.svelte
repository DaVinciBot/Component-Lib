<script>
	/** @type {{pre?: boolean, children?: import('svelte').Snippet}} */
	let { pre = false, children } = $props();
</script>

{#if pre}
	<pre class="mb-2 font-mono text-sm text-white">{@render children?.()}</pre>
{:else}
	<p class="mb-2 text-base text-justify text-white">{@render children?.()}</p>
{/if}
