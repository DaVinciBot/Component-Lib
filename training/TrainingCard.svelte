<script lang="ts">
	import type { TrainingSlotListItem } from '$lib/services/training';

	export type TrainingCardStatus = 'complete' | 'free' | 'hidden' | 'registered' | 'waiting' | 'my';

	type TrainingSlotView = Omit<TrainingSlotListItem, 'start'> & {
		start: Date | string;
	};

	type TrainingCardProps = {
		slot: TrainingSlotView;
		status: TrainingCardStatus;
		className?: string;
		variant?: 'default' | 'compact';
	};

	const allowedStatuses = new Set<TrainingCardStatus>([
		'complete',
		'free',
		'hidden',
		'registered',
		'waiting',
		'my'
	]);

	let {
		slot,
		status,
		className = '',
		variant = 'default'
	}: TrainingCardProps & {
		variant?: 'default' | 'compact';
	} = $props();

	function formatTime(value: Date | string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '--h--';
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${hours}h${minutes}`;
	}

	function formatTimeRange(startValue: Date | string, durationHours: number) {
		const start = new Date(startValue);
		if (Number.isNaN(start.getTime())) return '--h-- - --h--';
		const safeDuration = Number.isFinite(durationHours) ? Math.max(0.25, durationHours) : 1;
		const end = new Date(start.getTime() + safeDuration * 60 * 60 * 1000);
		return `${formatTime(start)} - ${formatTime(end)}`;
	}

	function getConfirmedRegistrations(slot: TrainingSlotView) {
		return (slot.on_site_registered ?? 0) + (slot.remote_registered ?? 0);
	}
</script>

{#if variant === 'compact'}
	<article
		class={`training-card--${status} w-full cursor-pointer rounded-[14px] border-[1.5px] border-(--card-color) bg-transparent px-2 py-0 ${className}`.trim()}
	>
		<div class="flex min-h-14 items-center justify-between gap-3">
			<h3
				class="line-clamp-2 min-w-0 flex-1 shrink grow-2 basis-auto text-[0.95rem] font-semibold text-(--card-color)"
			>
				{slot.name}
			</h3>
			<div class="flex shrink-2 grow basis-auto flex-col items-end text-right">
				<span class="text-[0.8rem] whitespace-nowrap text-dark-light-blue">
					{formatTimeRange(slot.start, slot.duration_hours)}
				</span>
				{#if status === 'my'}
					<span class="line-clamp-1 text-[0.8rem] text-dark-light-blue">
						{getConfirmedRegistrations(slot)} inscrit·e{getConfirmedRegistrations(slot) > 1
							? '·s'
							: ''}
					</span>
				{:else}
					<span class="line-clamp-1 text-[0.8rem] text-dark-light-blue">
						{slot.location ?? '-'}
					</span>
				{/if}
			</div>
		</div>
	</article>
{:else}
	<article
		class={`training-card--${status} shadow-[0_10px_24px_rgba(0,0,0,0.35)]} w-full cursor-pointer rounded-[12px] border-2 border-[var(--card-color)] bg-gradient-to-b from-[rgba(1,1,50,0.96)] to-[rgba(1,1,30,0.92)] p-[8px] ${className}`.trim()}
	>
		<h3 class={`training-card__title m-0 text-[1.05rem] font-bold text-(--card-color)`.trim()}>
			{slot.name}
		</h3>
		<div class="flex flex-col gap-1 text-left font-semibold">
			<div class="flex flex-wrap items-baseline gap-x-2">
				<span class="text-[0.85rem] text-dark-light-blue">Heure :</span>
				<span class="text-[0.8rem] text-light-blue">
					{formatTimeRange(slot.start, slot.duration_hours)}
				</span>
			</div>
			{#if status === 'my'}
				<div class="flex flex-wrap items-baseline gap-x-2">
					<span class="text-[0.85rem] text-dark-light-blue">Inscriptions :</span>
					<span class="text-[0.8rem] text-light-blue">
						{getConfirmedRegistrations(slot)} inscrit·e{getConfirmedRegistrations(slot) > 1
							? '·s'
							: ''}
					</span>
				</div>
			{:else}
				<div class="flex flex-wrap items-baseline gap-x-2">
					<span class="text-[0.85rem] text-dark-light-blue">Lieu :</span>
					<span class="text-[0.8rem] text-light-blue">
						{slot.location ?? '-'}
					</span>
				</div>
			{/if}
		</div>
	</article>
{/if}

<style>
	.training-card--complete {
		--card-color: var(--color-complete);
	}

	.training-card--free {
		--card-color: var(--color-light-blue);
	}

	.training-card--hidden {
		--card-color: var(--color-dark-blue-gray);
		opacity: 0.55;
	}

	.training-card--registered {
		--card-color: var(--color-registered);
	}

	.training-card--waiting {
		--card-color: var(--color-waiting);
	}

	.training-card--my {
		--card-color: var(--color-blue-peps);
	}
</style>
