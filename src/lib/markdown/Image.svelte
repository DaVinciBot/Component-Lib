<script lang="ts">
	interface ImageProps {
		href?: string;
		title?: string;
		text?: string;
	}

	const { href = '', title = '', text = '' }: ImageProps = $props();
</script>

<div class="flex w-full flex-col justify-center py-4">
	<img src={href} {title} alt={text} class="h-auto w-9/12 self-center rounded-lg shadow-lg" />
	{#if title || text}
		<p class="ml-4 self-center text-sm text-gray-500">{title || text}</p>
	{/if}
</div>
