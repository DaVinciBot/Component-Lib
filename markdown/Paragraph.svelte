<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ParagraphProps {
		pre?: boolean;
		children?: Snippet;
	}

	const { pre = false, children }: ParagraphProps = $props() as ParagraphProps;
</script>

{#if pre}
	<pre class="mb-2 font-mono text-sm text-white">{@render children?.()}</pre>
{:else}
	<p class="mb-2 text-justify text-base text-white">{@render children?.()}</p>
{/if}
