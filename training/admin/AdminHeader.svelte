<script lang="ts">
	import CTAButton from '$lib/components/utils/CTAButton.svelte';

	export let trainingsCount = 0;
	export let upcomingCount = 0;
	export let draftCount = 0;
	export let slotRangeDays = 0;
	export let onAddTraining = () => {};
	export let onAddSlot = () => {};
</script>

<header
	class="flex flex-col gap-6 rounded-[28px] border border-light-blue/15 bg-dark-blue/70 p-5 shadow-[0_20px_50px_rgba(1,7,32,0.35)] sm:p-6"
>
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<p class="text-xs tracking-[0.3em] text-light-blue/60 uppercase">Administration</p>
			<h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl">Pilotage des formations</h1>
			<p class="mt-2 text-sm text-light-blue/70">
				Gérez le catalogue et les sessions planifiées en un coup d'oeil.
			</p>
		</div>
		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
			<CTAButton type="button" variant="primary" size="sm" onclick={onAddSlot}>
				Nouveau créneaux
			</CTAButton>
			<CTAButton type="button" variant="secondary" size="sm" onclick={onAddTraining}>
				Nouvelle formation
			</CTAButton>
		</div>
	</div>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/80 p-4">
			<p class="text-xs tracking-[0.25em] text-light-blue/60 uppercase">Formations</p>
			<p class="mt-2 text-3xl font-bold text-white">{trainingsCount}</p>
			<p class="mt-1 text-xs text-light-blue/70">catalogue actif</p>
		</div>
		<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/80 p-4">
			<p class="text-xs tracking-[0.25em] text-light-blue/60 uppercase">Slots à venir</p>
			<p class="mt-2 text-3xl font-bold text-white">{upcomingCount}</p>
			<p class="mt-1 text-xs text-light-blue/70">dans les {slotRangeDays} prochains jours</p>
		</div>
		<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/80 p-4">
			<p class="text-xs tracking-[0.25em] text-light-blue/60 uppercase">Brouillons</p>
			<p class="mt-2 text-3xl font-bold text-white">{draftCount}</p>
			<p class="mt-1 text-xs text-light-blue/70">à finaliser</p>
		</div>
	</div>
</header>
