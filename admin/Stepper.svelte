<script>
	import Icon from '../share/Icon.svelte';

	/** @type {{steps?: any}} */
	let {
		steps = [
			{
				done: true,
				icon: 'link'
			},
			{
				done: true,
				icon: 'shipping'
			},
			{
				done: false,
				icon: 'done'
			}
		]
	} = $props();
</script>

<ol class="flex w-full justify-center">
	{#each steps as step, i (i)}
		<li
			class="flex items-center {i < steps.length - 1
				? step.done
					? "w-full text-primary-500 after:inline-block after:h-1 after:w-full after:border-4 after:border-b after:border-primary-400 after:content-['']"
					: " w-full after:inline-block after:h-1 after:w-full after:border-4 after:border-b after:border-gray-700 after:content-['']"
				: ''}"
		>
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:h-12 lg:w-12
					{step.icon === 'cancel' ? 'bg-red-500' : step.done ? 'bg-primary-500' : 'bg-gray-700'}"
			>
				<Icon name={step.icon} size="6" fill={'gray-100'} />
			</span>
		</li>
	{/each}
	<svg style="display: none;" class="fill-gray-100">
		<rect width="1" height="1" fill="currentColor" />
	</svg>
</ol>
