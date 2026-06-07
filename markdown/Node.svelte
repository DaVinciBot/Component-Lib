<script lang="ts">
	import Heading from './Heading.svelte';
	import Image from './Image.svelte';
	import Link from './Link.svelte';
	import List from './List.svelte';
	import NodeComponent from './Node.svelte';
	import Paragraph from './Paragraph.svelte';
	import Table from './Table.svelte';
	import TableCell from './TableCell.svelte';

	interface MarkdownNode {
		type: string;
		value?: string;
		depth?: number;
		ordered?: boolean;
		start?: number;
		spread?: boolean;
		url?: string;
		title?: string | null;
		alt?: string | null;
		children?: MarkdownNode[];
	}

	interface NodeProps {
		child?: MarkdownNode | null;
	}

	const { child = null }: NodeProps = $props();

	function nodeText(node: MarkdownNode): string {
		if (typeof node.value === 'string') {
			return node.value;
		}
		return node.children?.map(nodeText).join('') ?? '';
	}

	function nodeKey(node: MarkdownNode, index: number): string {
		const stablePart = node.value ?? node.url ?? nodeText(node).slice(0, 24);
		return `${node.type}-${String(index)}-${stablePart}`;
	}
</script>

{#if child}
	{#if child.type === 'heading'}
		<Heading depth={child.depth ?? 1} text={nodeText(child)} />
	{:else if child.type === 'paragraph'}
		<Paragraph>
			{#each child.children ?? [] as inline, index (nodeKey(inline, index))}
				{#if inline.type === 'text'}
					<!-- eslint-disable svelte/no-at-html-tags -->
					{@html inline.value ?? ''}
					<!-- eslint-enable svelte/no-at-html-tags -->
				{:else if inline.type === 'link'}
					<Link href={inline.url ?? ''} title={inline.title ?? undefined}>
						{#each inline.children ?? [] as sub, subIndex (nodeKey(sub, subIndex))}
							{#if sub.type === 'text'}{sub.value ?? ''}{:else}<NodeComponent child={sub} />{/if}
						{/each}
					</Link>
				{:else if inline.type === 'emphasis'}
					<em>{nodeText(inline)}</em>
				{:else if inline.type === 'strong'}
					<strong>{nodeText(inline)}</strong>
				{:else if inline.type === 'inlineCode'}
					<code>{inline.value ?? ''}</code>
				{:else}
					<NodeComponent child={inline} />
				{/if}
			{/each}
		</Paragraph>
	{:else if child.type === 'list'}
		<List ordered={child.ordered ?? false} start={child.start ?? 1} loose={child.spread ?? false}>
			{#each child.children ?? [] as li, index (nodeKey(li, index))}
				<li class="list-outside pl-4">
					{#each li.children ?? [] as inner, innerIndex (nodeKey(inner, innerIndex))}
						<NodeComponent child={inner} />
					{/each}
				</li>
			{/each}
		</List>
	{:else if child.type === 'image'}
		<Image href={child.url ?? ''} title={child.title ?? undefined} text={child.alt ?? ''} />
	{:else if child.type === 'code'}
		<Paragraph pre={true}>{child.value ?? ''}</Paragraph>
	{:else if child.type === 'table'}
		<Table>
			<thead>
				<tr>
					{#each child.children?.[0]?.children ?? [] as cell, index (nodeKey(cell, index))}
						<TableCell header={true} text={nodeText(cell)} />
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each child.children?.slice(1) ?? [] as row, rowIndex (nodeKey(row, rowIndex))}
					<tr>
						{#each row.children ?? [] as cell, cellIndex (nodeKey(cell, cellIndex))}
							<TableCell text={nodeText(cell)} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</Table>
	{:else if nodeText(child)}
		<Paragraph>{nodeText(child)}</Paragraph>
	{/if}
{/if}
