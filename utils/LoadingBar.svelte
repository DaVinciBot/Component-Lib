<script lang="ts">
	interface LoadingBarProps {
		percentage?: number;
		message?: string;
		color?: string;
	}

	const {
		percentage = 0,
		message = '',
		color = 'bg-primary-500'
	}: LoadingBarProps = $props() as LoadingBarProps;
</script>

<div>
	<div class="relative pt-1">
		<div class="mb-2 flex items-center justify-between">
			<div>
				<span
					class="inline-block rounded-full px-2 py-1 text-xs font-semibold text-white uppercase"
				>
					{percentage}%
				</span>
			</div>
			<div class="text-right">
				<span class="inline-block text-xs font-semibold text-white">
					{message}
				</span>
			</div>
		</div>
		<div class="mb-4 flex h-2 overflow-hidden rounded bg-gray-200 text-xs">
			<div
				style="width: {percentage}%;"
				class="flex flex-col justify-center text-center whitespace-nowrap text-white shadow-none {color}"
			></div>
		</div>
	</div>
</div>
