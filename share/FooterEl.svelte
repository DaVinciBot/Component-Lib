<script>
	/** @type {{items?: any, title?: string}} */
	let { items = [{ text: '', href: '' }], title = '' } = $props();
</script>

<div
	class="flex flex-col items-start content-between justify-between order-3 h-full text-left md:m-0"
>
	<p class="pb-1 font-bold text-white uppercase">{title}</p>
	<div class="flex flex-col items-start">
		{#each items as item}
			<a href={item.href} class="text-dark-blue-gray"> {@html item.text} </a>
		{/each}
	</div>
</div>
