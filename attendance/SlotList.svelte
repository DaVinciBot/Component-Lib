<script lang="ts">
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { Clock, MapPin } from "@lucide/svelte";

	export let slots: TrainingSlotListItem[] = [];
	export let selectedSlotId: number | null = null;
	export let onSelectSlot: (slotId: number) => void;
	export let formatDate: (value: string) => string;
	export let formatTimeRange: (startValue: string, durationHours: number) => string;
</script>

<section class="rounded-[26px] border border-light-blue/10 bg-dark-blue/80 p-4 sm:p-6">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold text-white">Mes slots</h2>
			<p class="text-xs text-light-blue/70">{slots.length} session(s)</p>
		</div>
	</div>
	<div class="mt-5 grid gap-3">
		{#each slots as slot}
			<button
				type="button"
				class={`flex w-full flex-col gap-2 rounded-2xl border p-3 text-left transition sm:p-4 cursor-pointer ${
					slot.slot_id === selectedSlotId
						? 'border-light-blue/20 bg-light-blue/10 text-light-blue'
						: 'border-light-blue/15 bg-dark-blue/60 text-light-blue/70 hover:border-light-blue/40'
				}`}
				onclick={() => onSelectSlot(slot.slot_id)}
			>
				<p class="text-sm font-semibold text-white">{slot.name}</p>
				<p class="text-xs tracking-[0.2em] text-dark-light-blue uppercase">
					<Clock class="inline-block size-3 mb-0.5" /> {formatDate(slot.start)} · {formatTimeRange(slot.start, slot.duration_hours)}
				</p>
				<p class="text-xs text-light-blue/70">
					<MapPin class="inline-block size-3 mb-0.5 mr-0.75" /> {slot.location ?? 'Lieu à définir'}
				</p>
			</button>
		{/each}
	</div>
</section>
