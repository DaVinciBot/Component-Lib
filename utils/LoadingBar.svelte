<script>
	/** @type {{percentage?: number, message?: string, color?: string}} */
	let { percentage = 0, message = '', color = 'bg-primary-500' } = $props();
</script>

<div>
	<div class="relative pt-1">
		<div class="flex mb-2 items-center justify-between">
			<div>
				<span
					class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white"
				>
					{percentage}%
				</span>
			</div>
			<div class="text-right">
				<span class="text-xs font-semibold inline-block text-white">
					{message}
				</span>
			</div>
		</div>
		<div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
			<div
				style="width: {percentage}%;"
				class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center {color}"
			></div>
		</div>
	</div>
</div>
