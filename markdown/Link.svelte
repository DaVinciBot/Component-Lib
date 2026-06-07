<script lang="ts">
	import type { Snippet } from 'svelte';

	interface LinkProps {
		href?: string;
		title?: string;
		children?: Snippet;
	}

	const { href = '', title, children }: LinkProps = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	{href}
	{title}
	target="_blank"
	rel="noopener noreferrer"
	class="text-blue-400 underline hover:text-blue-300"
>
	{@render children?.()}
	{#if !children}
		{title ?? ''}
	{/if}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
