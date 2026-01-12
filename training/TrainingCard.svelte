<script lang="ts">
	export type TrainingCardStatus =
		| 'complete'
		| 'free'
		| 'canceled'
		| 'registered'
		| 'waiting'
		| 'my';

	type TrainingCardProps = {
		title: string;
		time: string;
		location: string;
		registrations?: number | null;
		status?: TrainingCardStatus;
		showRegistrations?: boolean;
		className?: string;
	};

	const allowedStatuses = new Set<TrainingCardStatus>([
		'complete',
		'free',
		'canceled',
		'registered',
		'waiting',
		'my'
	]);

	let {
		title,
		time = '',
		location = '',
		registrations = null,
		status = 'free',
		showRegistrations = false,
		className = ''
	}: TrainingCardProps = $props();

	const safeStatus = $derived(() => (allowedStatuses.has(status) ? status : 'free'));
	const shouldShowRegistrations = $derived(
		() => showRegistrations || (registrations !== null && registrations !== undefined)
	);
</script>

<article
	class={`training-card--${safeStatus()} shadow-[0_10px_24px_rgba(0,0,0,0.35)]} w-full rounded-[12px] border-2 border-[var(--card-color)] bg-gradient-to-b from-[rgba(1,1,50,0.96)] to-[rgba(1,1,30,0.92)] px-[18px] pt-[14px] pb-[16px] ${className}`.trim()}
>
	<h3 class={`m-0 mb-2 text-[1.05rem] font-bold text-(--card-color)`.trim()}>
		{title}
	</h3>
	<div class="flex flex-col gap-1.5">
		<p class="m-0 flex items-baseline gap-2 text-[0.85rem] font-semibold">
			<span class="text-dark-light-blue">Heure</span>
			<span class="text-[0.8rem] font-bold text-light-blue">{time}</span>
		</p>
		{#if shouldShowRegistrations()}
			<p class="m-0 flex items-baseline gap-2 text-[0.85rem] font-semibold">
				<span class="text-dark-light-blue">Nb inscriptions</span>
				{#if registrations !== null && registrations !== undefined}
					<span class="text-[0.8rem] font-bold text-light-blue">
						{registrations}
					</span>
				{/if}
			</p>
		{:else}
			<p class="m-0 flex items-baseline gap-2 text-[0.85rem] font-semibold">
				<span class="text-dark-light-blue">Lieu</span>
				<span class="text-[0.8rem] font-bold text-light-blue">
					{location}
				</span>
			</p>
		{/if}
	</div>
</article>

<style>
	.training-card--complete {
		--card-color: #ff2a2a;
	}

	.training-card--free {
		--card-color: var(--color-light-blue);
	}

	.training-card--canceled {
		--card-color: var(--color-dark-blue-gray);
		opacity: 0.55;
	}

	.training-card--registered {
		--card-color: #7dff9b;
	}

	.training-card--waiting {
		--card-color: #f3b16d;
	}

	.training-card--my {
		--card-color: var(--color-blue-peps);
	}
</style>
