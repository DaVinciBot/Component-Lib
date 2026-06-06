<script lang="ts">
	type ListProps = {
		ordered?: boolean;
		start?: number;
		loose?: boolean;
		children?: import('svelte').Snippet;
	};

	let { ordered = false, start = 1, loose = false, children }: ListProps = $props();
</script>

<div class="py-2 pl-4">
	{#if ordered}
		<ol class="list-decimal list-inside">
			{@render children?.()}
		</ol>
	{:else}
		<ul class="list-disc list-inside">
			{@render children?.()}
		</ul>
	{/if}
</div>
