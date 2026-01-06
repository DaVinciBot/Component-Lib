<script>
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse">
		{@render children?.()}
	</table>
</div>
