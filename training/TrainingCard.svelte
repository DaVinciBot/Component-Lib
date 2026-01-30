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
	};

	const allowedStatuses = new Set<TrainingCardStatus>([
		'complete',
		'free',
		'hidden',
		'registered',
		'waiting',
		'my'
	]);

	let { slot, status, className = '' }: TrainingCardProps = $props();

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

<article
	class={`training-card--${status} shadow-[0_10px_24px_rgba(0,0,0,0.35)]} w-full cursor-pointer rounded-[12px] border-2 border-[var(--card-color)] bg-gradient-to-b from-[rgba(1,1,50,0.96)] to-[rgba(1,1,30,0.92)] px-[18px] pt-[14px] pb-[16px] ${className}`.trim()}
>
	<h3 class={`m-0 mb-2 text-[1.05rem] font-bold text-(--card-color)`.trim()}>
		{slot.name}
	</h3>
	<div class="flex flex-col gap-1.5">
		<p class="m-0 flex items-baseline gap-2 text-[0.85rem] font-semibold">
			<span class="text-dark-light-blue">Heure</span>
			<span class="text-[0.8rem] font-bold text-light-blue">
				{formatTimeRange(slot.start, slot.duration_hours)}
			</span>
		</p>
		{#if status === 'my'}
			<p class="m-0 flex items-baseline gap-2 text-[0.85rem] font-semibold">
				<span class="text-dark-light-blue">Inscriptions</span>
				<span class="text-[0.8rem] font-bold text-light-blue">
					{getConfirmedRegistrations(slot)} inscrit·e{getConfirmedRegistrations(slot) > 1
						? '·s'
						: ''}
				</span>
			</p>
		{:else}
			<p class="m-0 flex items-baseline gap-2 text-[0.85rem] font-semibold">
				<span class="text-dark-light-blue">Lieu</span>
				<span class="text-[0.8rem] font-bold text-light-blue">
					{slot.location ?? '-'}
				</span>
			</p>
		{/if}
	</div>
</article>

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
