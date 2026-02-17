<script lang="ts">
	import { formatParisTimeRange } from '$lib/helpers/parisTime';
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { MapPin,Clock,UserRound } from '@lucide/svelte'

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

	let {
		slot,
		status,
		className = '',
		variant = 'default'
	}: TrainingCardProps & {
		variant?: 'default' | 'compact';
	} = $props();

	function formatTimeRange(startValue: Date | string, durationHours: number) {
		return formatParisTimeRange(startValue, durationHours);
	}
	function getConfirmedRegistrations(slot: TrainingSlotView) {
		return (slot.on_site_registered ?? 0) + (slot.remote_registered ?? 0);
	}
</script>

{#if variant === 'compact'}
	<article
		class={`training-card--${status} w-full cursor-pointer rounded-[8px] border-l-8 border-1 border-l-[var(--card-color)] border-light-blue/30 bg-[rgba(1,1,50,0.96)] px-2 py-1 ${className}`.trim()}
	>
		<div class="flex min-h-14 items-center justify-between gap-3">
			<h3
				class="line-clamp-2 min-w-0 flex-1 shrink grow-2 basis-auto text-[0.95rem] font-semibold"
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
		class={`training-card--${status} shadow-[0_10px_24px_rgba(0,0,0,0.35)]} w-full cursor-pointer rounded-[8px] border-l-8 border-1 border-l-[var(--card-color)] border-light-blue/30 bg-[rgba(1,1,50,0.96)] py-[8px] px-[12px] ${className}`.trim()}
	>
		<h3 class={`training-card__title overflow-hidden text-ellipsis text-start m-0 mb-1 text-[1.0rem] font-bold`.trim()}>
			{slot.name}
		</h3>
		<div class="flex flex-col gap-1 text-left font-semibold">
			<div class="flex flex-wrap items-center gap-x-2">
				<span class="text-[0.85rem] text-dark-light-blue"><Clock class="size-4" /></span>
				<span class="text-[0.8rem] text-dark-light-blue">
					{formatTimeRange(slot.start, slot.duration_hours)}
				</span>
			</div>
			{#if status === 'my'}
				<div class="flex flex-wrap items-center gap-x-2">
					<span class="text-[0.85rem] text-dark-light-blue"><UserRound class="size-4" /></span>
					<span class="text-[0.8rem] text-dark-light-blue">
						{getConfirmedRegistrations(slot)} inscrit·e{getConfirmedRegistrations(slot) > 1
							? '·s'
							: ''}
					</span>
				</div>
			{:else}
				<div class="flex flex-wrap items-center gap-x-2">
					<span class="text-[0.85rem] text-dark-light-blue"><MapPin class="size-4" /></span>
					<span class="text-[0.8rem] text-dark-light-blue">
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
