<script lang="ts">
	import type { Snippet } from 'svelte';

	interface TableProps {
		children?: Snippet;
	}

	const { children }: TableProps = $props();
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse">
		{@render children?.()}
	</table>
</div>
