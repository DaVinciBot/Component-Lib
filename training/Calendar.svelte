<script lang="ts">
	import { goto } from '$app/navigation';
	import Checkbox from '$lib/components/share/Checkbox.svelte';
	import TrainingCard, {
		type TrainingCardStatus
	} from '$lib/components/training/TrainingCard.svelte';
	import TrainingSlotModal from '$lib/components/training/TrainingSlotModal.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { format } from 'date-fns';
	import { onMount } from 'svelte';

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
	};

	const weekdays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
	const FILTERS_KEY = 'training_calendar_filters';

	let {
		slots = [],
		initialDate = new Date(),
		onSelectSlot,
		onSelectDay,
		onWeekChange,
		onRegistrationChange,
		canManageTraining = false
	}: CalendarProps = $props();

	let isInPerson = $state(false);
	let isOnline = $state(false);
	let selectedSlot = $state<CalendarSlot | null>(null);
	let isModalOpen = $state(false);
	let filtersReady = $state(false);

	let viewDate = $state(new Date());

	$effect(() => {
		viewDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
	});

	function loadFilters() {
		try {
			if (typeof localStorage === 'undefined') return null;
			const raw = localStorage.getItem(FILTERS_KEY);
			return raw ? (JSON.parse(raw) as { inPerson?: boolean; online?: boolean }) : null;
		} catch (err) {
			return null;
		}
	}

	$effect(() => {
		if (!filtersReady || typeof localStorage === 'undefined') return;
		const payload = {
			inPerson: isInPerson,
			online: isOnline
		};
		try {
			localStorage.setItem(FILTERS_KEY, JSON.stringify(payload));
		} catch (err) {
			// ignore
		}
	});

	onMount(() => {
		const saved = loadFilters();
		if (saved) {
			isInPerson = Boolean(saved.inPerson);
			isOnline = Boolean(saved.online);
		}
		filtersReady = true;
	});

	const weekStart = $derived(() => getWeekStart(viewDate));
	const weekLabel = $derived(() => `Semaine ${getWeekNumber(viewDate)}`);

	const calendarDays = $derived(() =>
		Array.from({ length: 7 }, (_, index) => {
			const date = new Date(
				weekStart().getFullYear(),
				weekStart().getMonth(),
				weekStart().getDate() + index
			);
			const key = toDateKey(date);
			return {
				date,
				key,
				isToday: key === toDateKey(new Date())
			};
		})
	);

	const slotsByDay = $derived(() => {
		const map = new Map<string, CalendarSlot[]>();
		for (const slot of filteredSlots()) {
			const date = new Date(slot.start);
			if (Number.isNaN(date.getTime())) continue;
			const key = toDateKey(date);
			const existing = map.get(key) ?? [];
			existing.push(slot);
			map.set(key, existing);
		}
		return map;
	});

	function isInPersonSlot(slot: CalendarSlot) {
		return (slot.on_site_seats ?? 0) > 0 || (slot.on_site_remaining ?? 0) > 0;
	}

	function isOnlineSlot(slot: CalendarSlot) {
		return (slot.remote_seats ?? 0) > 0 || (slot.remote_remaining ?? 0) > 0;
	}

	const filteredSlots = $derived(() => {
		const filterByFormat = isInPerson || isOnline;
		return slots.filter((slot) => {
			const matchesFormat =
				!filterByFormat || (isInPerson && isInPersonSlot(slot)) || (isOnline && isOnlineSlot(slot));
			return matchesFormat;
		});
	});

	function toDateKey(date: Date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getWeekStart(date: Date) {
		const dayIndex = (date.getDay() + 6) % 7;
		return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayIndex);
	}

	function getWeekNumber(date: Date) {
		const target = new Date(date.getTime());
		const dayNr = (target.getDay() + 6) % 7;
		target.setDate(target.getDate() - dayNr + 3);
		const firstThursday = new Date(target.getFullYear(), 0, 4);
		const diff = target.getTime() - firstThursday.getTime();
		return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
	}

	function setViewDate(date: Date) {
		viewDate = date;
		onWeekChange?.(getWeekStart(date));
	}

	function goPrev() {
		setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - 7));
	}

	function goNext() {
		setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 7));
	}

	function goToday() {
		setViewDate(new Date());
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
		class="flex flex-col gap-3 rounded-[22px] border border-light-blue/30 bg-linear-to-b from-[rgba(3,6,50,0.9)] to-[rgba(1,1,30,0.82)] px-4 py-4 text-sm text-light-blue shadow-[0_14px_40px_rgba(1,4,30,0.55)] lg:hidden"
	>
		<div class="grid grid-cols-[auto_1fr_auto] items-center gap-2">
			<CtaButton
				type="button"
				variant="peps"
				size="sm"
				class="flex size-9 items-center justify-center rounded-full"
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
			<span class="text-center text-[0.8rem] tracking-[0.3em] text-dark-light-blue uppercase">
				{weekLabel()}
			</span>
			<CtaButton
				type="button"
				variant="peps"
				size="sm"
				class="flex size-9 items-center justify-center rounded-full"
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
		</div>
		<div class="flex flex-wrap items-center justify-center gap-2">
			<CtaButton
				type="button"
				variant="peps"
				class="flex h-9 items-center justify-center rounded-full px-4 text-[0.7rem] uppercase"
				size="sm"
				onclick={goToday}
			>
				Aujourd'hui
			</CtaButton>
			{#if canManageTraining}
				<CtaButton
					type="button"
					variant="primary"
					size="sm"
					class="flex h-9 items-center justify-center rounded-full px-4 text-[0.7rem] uppercase"
					onclick={() => goto('admin')}
				>
					Accès admin
				</CtaButton>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-2">
			<label
				class="flex cursor-pointer items-center gap-2 rounded-full border border-light-blue/20 bg-dark-blue/60 px-3 py-2 text-[0.62rem] tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox
					bind:checked={isInPerson}
					name="filter_in_person"
					value="in-person"
					required
					className="size-4.5"
				/>
				Présentiel
			</label>
			<label
				class="flex cursor-pointer items-center gap-2 rounded-full border border-light-blue/20 bg-dark-blue/60 px-3 py-2 text-[0.62rem] tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox
					bind:checked={isOnline}
					name="filter_online"
					value="online"
					className="size-4.5"
				/>
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
				<Checkbox bind:checked={isInPerson} name="filter_in_person" value="in-person" required />
				Présentiel
			</label>
			<label
				class="flex cursor-pointer items-center gap-2 text-xs tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={isOnline} name="filter_online" value="online" />
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
			{#if canManageTraining}
				<CtaButton
					type="button"
					variant="primary"
					size="sm"
					class="flex size-7 items-center pr-2 pl-2 uppercase"
					onclick={() => goto('admin')}
				>
					Accès admin
				</CtaButton>
			{/if}
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
					<span>{weekdays[index]}</span>
					<span>{format(day.date, 'dd/MM')}</span>
				</button>
			{/each}
		</div>
		<div
			class="no-scrollbar min-h-0 flex-1 overflow-y-auto border-x border-b border-light-blue/30 bg-blue-gray/20"
		>
			<div class="grid min-h-full grid-cols-7">
				{#each calendarDays() as day, index}
					<div
						class={`h-full overflow-hidden border-light-blue/30 ${index !== 6 ? 'border-r' : ''}`}
					>
						<div class="flex h-full flex-col gap-3 p-3">
							{#each slotsByDay().get(day.key) ?? [] as slot}
								<button type="button" tabindex="0" onclick={() => handleSlotSelect(slot)}>
									<TrainingCard {slot} status={slot.cardStatus ?? 'free'} />
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div
		class="no-scrollbar mt-4 flex-1 overflow-y-auto rounded-2xl border border-light-blue/30 bg-blue-gray/20 p-3 lg:hidden"
	>
		<div class="flex flex-col gap-4">
			{#each calendarDays() as day, index}
				<div class="flex items-start gap-3">
					<button
						type="button"
						class={`flex h-14 w-16 flex-col items-center justify-center rounded-xl border-2 border-light-blue/30 bg-dark-blue/60 text-center ${
							day.isToday ? 'border-primary-400/60 text-primary-400' : 'text-light-blue'
						}`}
						onclick={() => handleDaySelect(day.date)}
					>
						<span class="text-[0.72rem] tracking-[0.24em] text-dark-light-blue uppercase">
							{weekdays[index]}
						</span>
						<span class="font-semibold">{format(day.date, 'dd/MM')}</span>
					</button>
					<div class="flex flex-1 flex-col gap-2">
						{#if (slotsByDay().get(day.key) ?? []).length === 0}
							<div
								class="flex h-14 items-center rounded-[14px] border-2 border-dashed border-dark-light-blue-faded/50 bg-dark-blue/40 px-2 text-[0.7rem] tracking-[0.24em] text-dark-light-blue uppercase"
							>
								Aucune formation
							</div>
						{:else}
							{#each slotsByDay().get(day.key) ?? [] as slot}
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
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap gap-3 pt-4 pl-0.5 text-xs tracking-wide sm:gap-5 sm:text-sm">
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
