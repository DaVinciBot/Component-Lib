<script lang="ts">
	interface TableCellProps {
		header?: boolean;
		text?: string;
	}

	const { header = false, text = '' }: TableCellProps = $props() as TableCellProps;
</script>

{#if header}
	<th class="border px-4 py-2">{text}</th>
{:else}
	<td class="border px-4 py-2">{text}</td>
{/if}
