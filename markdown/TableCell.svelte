<script>
	/** @type {{align?: string, header?: boolean, text?: string}} */
	let { align = 'left', header = false, text = '' } = $props();
</script>

{#if header}
	<th class="px-4 py-2 border">{text}</th>
{:else}
	<td class="px-4 py-2 border">{text}</td>
{/if}
