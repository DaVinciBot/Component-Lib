<script lang="ts">
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { Calendar, Clock, MapPin } from '@lucide/svelte';

	export let selectedSlot: TrainingSlotListItem | null = null;
	export let formatDate: (value: string) => string;
	export let formatTimeRange: (startValue: string, durationHours: number) => string;
</script>

{#if selectedSlot}
	<div class="mt-3 grid gap-4 min-[1040px]:grid-cols-3 md:grid-cols-3">
		<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/10 p-4">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
				>
					<Calendar class="size-5.5" />
				</div>
				<div>
					<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">Date</p>
					<p class="m-0 text-sm font-semibold text-light-blue">
						{formatDate(selectedSlot.start)}
					</p>
				</div>
			</div>
		</div>
		<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/10 p-4">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
				>
					<Clock class="size-5.5" />
				</div>
				<div>
					<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">Horaire</p>
					<p class="m-0 text-sm font-semibold text-light-blue">
						{formatTimeRange(selectedSlot.start, selectedSlot.duration_hours ?? 1)}
					</p>
				</div>
			</div>
		</div>
		<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/10 p-4">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
				>
					<MapPin class="size-5.5" />
				</div>
				<div>
					<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">Lieu</p>
					<p class="m-0 text-sm font-semibold text-light-blue">
						{selectedSlot.location ?? 'À définir'}
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
