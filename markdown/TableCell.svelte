<script lang="ts">
	interface TableCellProps {
		header?: boolean;
		text?: string;
	}

	const { header = false, text = '' }: TableCellProps = $props();
</script>

{#if header}
	<th class="px-4 py-2 border">{text}</th>
{:else}
	<td class="px-4 py-2 border">{text}</td>
{/if}
