<script lang="ts">
	import Checkbox from '$lib/components/share/Checkbox.svelte';
	import Spinner from '$lib/components/share/Spinner.svelte';
	import {
		filterSlotsByFormat,
		getCalendarDays,
		getWeekNumber,
		getWeekStart,
		groupSlotsByDay,
		weekdays
	} from '$lib/components/training/helpers/calendar';
	import { calendarFilters } from '$lib/components/training/stores/trainingCalendarFilters';
	import TrainingCard, {
		type TrainingCardStatus
	} from '$lib/components/training/TrainingCard.svelte';
	import TrainingSlotModal from '$lib/components/training/TrainingSlotModal.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import { formatParisDayShort, getParisDateUtc } from '$lib/helpers/parisTime';
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { onMount, tick } from 'svelte';

	export type CalendarSlot = Omit<TrainingSlotListItem, 'start'> & {
		start: Date | string;
		cardStatus?: TrainingCardStatus;
	};

	type CalendarProps = {
		slots?: CalendarSlot[];
		initialDate?: Date;
		onSelectSlot?: (slot: CalendarSlot) => void;
		onSelectDay?: (date: Date) => void;
		onWeekChange?: (weekStart: Date) => void;
		onRegistrationChange?: () => void;
		canManageTraining?: boolean;
		isLoading?: boolean;
		errorMessage?: string | null;
		onRetry?: () => void;
	};

	let {
		slots = [],
		initialDate = new Date(),
		onSelectSlot,
		onSelectDay,
		onWeekChange,
		onRegistrationChange,
		canManageTraining = false,
		isLoading = false,
		errorMessage = null,
		onRetry
	}: CalendarProps = $props();

	let isInPerson = $state(false);
	let isOnline = $state(false);
	let selectedSlot = $state<CalendarSlot | null>(null);
	let isModalOpen = $state(false);
	let filtersReady = $state(false);
	let todayRow: HTMLDivElement | null = $state(null);

	let viewDate = $state(getParisDateUtc(new Date()) ?? new Date());

	$effect(() => {
		viewDate = getParisDateUtc(initialDate) ?? new Date();
	});

	$effect(() => {
		if (!filtersReady) return;
		calendarFilters.update((current) => {
			if (current.inPerson === isInPerson && current.online === isOnline) return current;
			return { inPerson: isInPerson, online: isOnline };
		});
	});

	onMount(() => {
		const unsubscribe = calendarFilters.subscribe((value) => {
			isInPerson = value.inPerson;
			isOnline = value.online;
		});
		filtersReady = true;
		return () => unsubscribe();
	});

	onMount(async () => {
		if (typeof window === 'undefined') return;
		if (!window.matchMedia('(max-width: 1023px)').matches) return;
		await tick();
		todayRow?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	});

	const weekStart = $derived(() => getWeekStart(viewDate));
	const weekLabel = $derived(() => `Semaine ${getWeekNumber(viewDate)}`);

	const calendarDays = $derived(() => getCalendarDays(weekStart()));

	const filteredSlots = $derived(() =>
		filterSlotsByFormat(slots, { inPerson: isInPerson, online: isOnline })
	);

	const slotsByDay = $derived(() => groupSlotsByDay(filteredSlots()));

	function setViewDate(date: Date) {
		viewDate = date;
		onWeekChange?.(getWeekStart(date));
	}

	function goPrev() {
		setViewDate(new Date(viewDate.getTime() - 7 * 24 * 60 * 60 * 1000));
	}

	function goNext() {
		setViewDate(new Date(viewDate.getTime() + 7 * 24 * 60 * 60 * 1000));
	}

	function goToday() {
		setViewDate(getParisDateUtc(new Date()) ?? new Date());
		void scrollToToday();
	}

	async function scrollToToday() {
		if (typeof window === 'undefined') return;
		if (!window.matchMedia('(max-width: 1023px)').matches) return;
		await tick();
		todayRow?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}

	function handleSlotSelect(slot: CalendarSlot) {
		selectedSlot = slot;
		isModalOpen = true;
		onSelectSlot?.(slot);
	}

	function handleModalClose() {
		isModalOpen = false;
	}

	function handleDaySelect(date: Date) {
		onSelectDay?.(date);
	}

	// TODO: order by date and time
	// TODO: responsive design, style improvements
</script>

<section
	class="flex h-full flex-col rounded-[26px] border border-light-blue/40 bg-dark-blue/90 p-4 shadow-[0_18px_60px_rgba(2,10,60,0.45)] sm:p-6"
>
	<header
		class="flex flex-col gap-2 rounded-[22px] border border-light-blue/30 bg-linear-to-b from-[rgba(3,6,50,0.9)] to-[rgba(1,1,30,0.82)] px-3 py-3 text-sm text-light-blue shadow-[0_14px_40px_rgba(1,4,30,0.55)] lg:hidden"
	>
		<div class="grid grid-cols-[auto_1fr_auto_auto] gap-1">
			<div
				class="wrap left-center inset-y-0 grid grid-cols-[auto_1fr_auto_auto] items-center justify-between"
			>
				<CtaButton
					type="button"
					variant="secondary"
					size="xs"
					class="flex h-1 w-5  items-center justify-center rounded-full border-light-blue/0 text-dark-light-blue"
					fullWidth={false}
					onclick={goPrev}
					aria-label="Semaine précédente"
				>
					<svg
						class="size-4"
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M7.5 2.5 4 6l3.5 3.5" />
					</svg>
				</CtaButton>
				<span class="text-center text-[0.75rem] tracking-[0.3em] text-dark-light-blue uppercase">
					{weekLabel()}
				</span>
				<CtaButton
					type="button"
					variant="secondary"
					size="xs"
					class="flex h-1 w-5 items-center justify-center rounded-full border-light-blue/0 text-dark-light-blue"
					fullWidth={false}
					onclick={goNext}
					aria-label="Semaine suivante"
				>
					<svg
						class="size-4"
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M4.5 2.5 8 6l-3.5 3.5" />
					</svg>
				</CtaButton>
			</div>
			<CtaButton
				type="button"
				variant="secondary"
				class="flex items-center justify-center  rounded-full border-light-blue/30 px-4 text-[0.7rem] uppercase"
				fullWidth={false}
				size="sm"
				onclick={goToday}
			>
				Aujourd'hui
			</CtaButton>
		</div>
		<div class="grid grid-cols-2 gap-1">
			<label
				class="flex cursor-pointer items-center gap-1.5 px-1 text-[0.62rem] tracking-widest text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={isInPerson} name="filter_in_person" value="in-person" required />
				Présentiel
			</label>
			<label
				class="flex cursor-pointer items-center gap-1.5 px-1 text-[0.62rem] tracking-widest text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={isOnline} name="filter_online" value="online" />
				En ligne
			</label>
		</div>
	</header>
	<header
		class="hidden flex-wrap items-center justify-between gap-4 rounded-xl border border-light-blue/30 bg-dark-blue/70 px-4 py-3 text-sm text-light-blue lg:flex"
	>
		<div class="flex flex-wrap items-center gap-6">
			<label
				class="flex cursor-pointer items-center gap-2 text-xs tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox
					bind:checked={isInPerson}
					name="filter_in_person"
					value="in-person"
					required
					className="size-4"
				/>
				Présentiel
			</label>
			<label
				class="flex cursor-pointer items-center gap-2 text-xs tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={isOnline} name="filter_online" value="online" className="size-4" />
				En ligne
			</label>
		</div>
		<div
			class="grid {canManageTraining
				? 'grid-cols-[min-content_auto_min-content_min-content_auto]'
				: 'grid-cols-[min-content_auto_min-content_min-content]'} items-center gap-3 text-xs tracking-[0.3em] text-dark-light-blue uppercase"
		>
			<CtaButton
				type="button"
				variant="peps"
				size="sm"
				class="flex size-7 items-center justify-center pr-1 pl-1"
				onclick={goPrev}
				aria-label="Semaine précédente"
			>
				<svg
					class="size-3.5"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M7.5 2.5 4 6l3.5 3.5" />
				</svg>
			</CtaButton>
			<span class="text-dark-light-blue uppercase">{weekLabel()}</span>
			<CtaButton
				type="button"
				variant="peps"
				size="sm"
				class="flex size-7 items-center justify-center pr-1 pl-1"
				onclick={goNext}
				aria-label="Semaine suivante"
			>
				<svg
					class="size-3.5"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M4.5 2.5 8 6l-3.5 3.5" />
				</svg>
			</CtaButton>
			<CtaButton
				type="button"
				variant="peps"
				class="flex size-7 items-center pr-2 pl-2 uppercase"
				size="sm"
				onclick={goToday}
			>
				Aujourd'hui
			</CtaButton>
		</div>
	</header>

	<div class="mt-4 hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
		<div
			class="grid grid-cols-[repeat(7,1fr)] border border-light-blue/30 bg-dark-blue-gray/20 text-sm tracking-[0.2em] text-light-blue uppercase"
		>
			{#each calendarDays() as day, index}
				<button
					type="button"
					class={`flex items-center justify-center gap-2 border-light-blue/30 px-3 py-3 ${
						index !== 6 ? 'border-r' : ''
					} ${day.isToday ? 'text-primary-400' : ''}`}
					onclick={() => handleDaySelect(day.date)}
				>
					<span>{weekdays[index].substring(0, 2)}</span>
					<span>{formatParisDayShort(day.date)}</span>
				</button>
			{/each}
		</div>
		<div
			class="no-scrollbar relative min-h-0 flex-1 overflow-y-auto border-x border-b border-light-blue/30 bg-blue-gray/20"
		>
			{#if errorMessage}
				<div class="flex min-h-full items-center justify-center p-6">
					<div class="flex flex-col items-center gap-3 text-waiting">
						<p class="text-sm tracking-wide">{errorMessage}</p>
						{#if onRetry}
							<CtaButton type="button" variant="peps" size="sm" onclick={onRetry}>
								Réessayer
							</CtaButton>
						{/if}
					</div>
				</div>
			{:else}
				<div class="grid min-h-full grid-cols-7">
					{#each calendarDays() as day, index}
						<div
							class={`h-full overflow-hidden border-light-blue/30 ${index !== 6 ? 'border-r' : ''}`}
						>
							<div class="flex h-full flex-col gap-3 p-3">
								{#each slotsByDay().get(day.key) ?? [] as slot (slot.slot_id)}
									<button type="button" tabindex="0" onclick={() => handleSlotSelect(slot)}>
										<TrainingCard {slot} status={slot.cardStatus ?? 'free'} />
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
			{#if isLoading}
				<div class="absolute inset-0 flex items-center justify-center bg-dark-blue/70">
					<Spinner
						divClass="rounded-[22px] border border-light-blue/30 bg-dark-blue/80 px-5 py-4 text-light-blue/80"
					>
						Chargement du calendrier
					</Spinner>
				</div>
			{/if}
		</div>
	</div>

	<div
		class="no-scrollbar relative mt-4 flex-1 overflow-y-auto rounded-2xl border border-light-blue/30 bg-blue-gray/20 p-3 lg:hidden"
	>
		{#if errorMessage}
			<div class="flex min-h-48 items-center justify-center px-3 py-8">
				<div class="flex flex-col items-center gap-3 text-waiting">
					<p class="text-sm tracking-wide">{errorMessage}</p>
					{#if onRetry}
						<CtaButton type="button" variant="peps" size="sm" onclick={onRetry}>
							Réessayer
						</CtaButton>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				{#each calendarDays() as day, index}
					{#if day.isToday}
						<div class="flex scroll-mt-4 flex-col gap-2" bind:this={todayRow}>
							<button
								type="button"
								class="flex h-14 w-full flex-col items-center justify-center rounded-[14px] border-primary-400/60 text-center tracking-[0.32em] text-primary-400
								"
								onclick={() => handleDaySelect(day.date)}
							>
								<span class="text-[0.72rem] uppercase">
									{weekdays[index]}
								</span>
								<span class="font-semibold">{formatParisDayShort(day.date)}</span>
							</button>
							<div class="flex flex-1 flex-col gap-2">
								{#if (slotsByDay().get(day.key) ?? []).length === 0}
									<div
										class="flex h-14 w-full items-center rounded-[14px] border-2 border-dashed border-dark-light-blue-faded/50 bg-dark-blue/40 px-2 text-[0.7rem] tracking-[0.24em] text-dark-light-blue uppercase"
									>
										Aucune formation
									</div>
								{:else}
									{#each slotsByDay().get(day.key) ?? [] as slot (slot.slot_id)}
										<button type="button" tabindex="0" onclick={() => handleSlotSelect(slot)}>
											<TrainingCard
												{slot}
												status={slot.cardStatus ?? 'free'}
												variant="compact"
												className="text-left"
											/>
										</button>
									{/each}
								{/if}
							</div>
						</div>
					{:else}
						<div class="flex flex-col gap-2">
							<button
								type="button"
								class="h-14 w-full flex-col items-center justify-center rounded-[14px] border-light-blue/30 text-center tracking-[0.32em] text-light-blue not-last:flex"
								onclick={() => handleDaySelect(day.date)}
							>
								<span class="text-[0.72rem] uppercase">
									{weekdays[index]}
								</span>
								<span class="font-semibold">{formatParisDayShort(day.date)}</span>
							</button>
							<div class="flex flex-1 flex-col gap-2">
								{#if (slotsByDay().get(day.key) ?? []).length === 0}
									<div
										class="flex h-14 w-full items-center rounded-[14px] border-2 border-dashed border-dark-light-blue-faded/50 bg-dark-blue/40 px-2 text-[0.7rem] tracking-[0.24em] text-dark-light-blue uppercase"
									>
										Aucune formation
									</div>
								{:else}
									{#each slotsByDay().get(day.key) ?? [] as slot (slot.slot_id)}
										<button type="button" tabindex="0" onclick={() => handleSlotSelect(slot)}>
											<TrainingCard
												{slot}
												status={slot.cardStatus ?? 'free'}
												variant="compact"
												className="text-left"
											/>
										</button>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
		{#if isLoading}
			<div class="absolute inset-0 flex items-center justify-center bg-dark-blue/70">
				<Spinner
					divClass="rounded-[22px] border border-light-blue/30 bg-dark-blue/80 px-5 py-4 text-light-blue/80"
				>
					Chargement du calendrier
				</Spinner>
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap gap-3 pt-2 pl-0.5 text-xs tracking-wide sm:gap-5 sm:pt-4 sm:text-sm">
		<div class="text-light-blue">Légende :</div>
		<div class="text-light-blue">Libre</div>
		<div class="text-registered">Inscrit·e</div>
		<div class="text-waiting">Sur liste d'attente</div>
		<div class="text-blue-peps">Ma formation</div>
		{#if canManageTraining}
			<div class="text-complete">Complète</div>
			<div class="text-dark-blue-gray opacity-55">Masquée</div>
		{/if}
	</div>
</section>

<TrainingSlotModal
	slot={selectedSlot}
	open={isModalOpen}
	onClose={handleModalClose}
	{onRegistrationChange}
	{canManageTraining}
/>

<style>
	.no-scrollbar {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
