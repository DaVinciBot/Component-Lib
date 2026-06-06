<script>
	/** @type {{title?: string, rank_and_points?: string, image?: string, logo: any, marginLeft?: string, marginBottom?: string}} */
	let {
		title = '',
		rank_and_points = '',
		image = '',
		logo,
		marginLeft = '',
		marginBottom = ''
	} = $props();

	const SvelteComponent = $derived(logo);
</script>

<div
	class="rounded-xl border-[3.5px] border-dark-light-blue p-4 w-105 flex flex-col gap-2 min-w-96"
>
	<div class="flex flex-col">
		<h1 class="text-xl font-bold">{title}</h1>
		<h1 class="text-xl font-bold">{rank_and_points}</h1>
	</div>
	<div id="" class="flex flex-row h-28 items-center">
		<img src={image} alt={title} class="h-28 aspect-auto" />
		<div class="flex items-center" style="transform: translate({marginLeft}px, {-marginBottom}px)">
			<SvelteComponent class="h-28" sizeW="163px" sizeH="185px" />
		</div>
	</div>
</div>
