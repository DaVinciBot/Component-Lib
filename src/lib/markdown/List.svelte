<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ListProps {
		ordered?: boolean;
		start?: number;
		loose?: boolean;
		children?: Snippet;
	}

	const { ordered = false, start = 1, loose = false, children }: ListProps = $props();
</script>

<div class="py-2 pl-4">
	{#if ordered}
		<ol class="list-inside list-decimal" {start} class:space-y-2={loose}>
			{@render children?.()}
		</ol>
	{:else}
		<ul class="list-inside list-disc" class:space-y-2={loose}>
			{@render children?.()}
		</ul>
	{/if}
</div>
