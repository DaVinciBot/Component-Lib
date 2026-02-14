<script lang="ts">
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { Calendar, Clock, MapPin } from '@lucide/svelte';

	export let selectedSlot: TrainingSlotListItem | null = null;
	export let onRefresh = () => {};
	export let currentUserId: string | null = null;
	export let formatDate: (value: string) => string;
	export let formatTimeRange: (startValue: string, durationHours: number) => string;
</script>

<header
	class="flex flex-col gap-6 rounded-[28px] border border-light-blue/15 bg-dark-blue/70 p-4 shadow-[0_20px_50px_rgba(1,7,32,0.35)] sm:p-6"
>
	<div
		class="flex flex-col gap-4 min-[1040px]:flex-row min-[1040px]:items-center min-[1040px]:justify-between"
	>
		<div>
			<p class="text-xs tracking-[0.3em] text-light-blue/60 uppercase">Formateur·ice·s</p>
			<h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl">Présences aux formations</h1>
			<p class="mt-2 text-sm text-light-blue/70">
				Indiquez les présences des membres sur vos slots de formation.
			</p>
		</div>
		<div class="flex flex-wrap gap-3 sm:justify-end">
			<CtaButton type="button" variant="primary" size="sm" onclick={onRefresh}>
				Actualiser
			</CtaButton>
			{#if currentUserId}
				<CtaButton href="/" variant="secondary" size="sm">Retour au calendrier</CtaButton>
			{/if}
		</div>
	</div>
	{#if selectedSlot}
		<div class="grid gap-4 min-[1040px]:grid-cols-3 sm:grid-cols-2">
			<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/80 p-4">
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
			<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/80 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
					>
						<Clock class="size-5.5" />
					</div>
					<div>
						<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
							Horaire
						</p>
						<p class="m-0 text-sm font-semibold text-light-blue">
							{formatTimeRange(selectedSlot.start, selectedSlot.duration_hours ?? 1)}
						</p>
					</div>
				</div>
			</div>
			<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/80 p-4">
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
</header>
