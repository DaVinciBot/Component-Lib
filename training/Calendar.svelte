<script lang="ts">
	import Checkbox from '$lib/components/share/Checkbox.svelte';
	import TrainingCard, {
		type TrainingCardStatus
	} from '$lib/components/training/TrainingCard.svelte';
	import TrainingSlotModal from '$lib/components/training/TrainingSlotModal.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { format } from 'date-fns';

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
	};

	const weekdays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

	let {
		slots = [],
		initialDate = new Date(),
		onSelectSlot,
		onSelectDay,
		onWeekChange
	}: CalendarProps = $props();

	let isInPerson = $state(false);
	let isOnline = $state(false);
	let hasSeats = $state(false);
	let selectedSlot = $state<CalendarSlot | null>(null);
	let isModalOpen = $state(false);

	let viewDate = $state(new Date());

	$effect(() => {
		viewDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
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

	function hasAvailableSeats(slot: CalendarSlot) {
		const hasCapacityInfo = slot.on_site_remaining !== null || slot.remote_remaining !== null;
		if (!hasCapacityInfo) return true;
		return (slot.on_site_remaining ?? 0) > 0 || (slot.remote_remaining ?? 0) > 0;
	}

	function isInPersonSlot(slot: CalendarSlot) {
		return (
			Boolean(slot.location) || (slot.on_site_seats ?? 0) > 0 || (slot.on_site_remaining ?? 0) > 0
		);
	}

	function isOnlineSlot(slot: CalendarSlot) {
		return (
			Boolean(slot.video_conference_link) ||
			(slot.remote_seats ?? 0) > 0 ||
			(slot.remote_remaining ?? 0) > 0
		);
	}

	const filteredSlots = $derived(() => {
		const filterByFormat = isInPerson || isOnline;
		return slots.filter((slot) => {
			const matchesFormat =
				!filterByFormat || (isInPerson && isInPersonSlot(slot)) || (isOnline && isOnlineSlot(slot));
			const matchesSeats = !hasSeats || hasAvailableSeats(slot);
			return matchesFormat && matchesSeats;
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
	class="flex h-full flex-col rounded-[26px] border border-light-blue/40 bg-dark-blue/90 p-6 shadow-[0_18px_60px_rgba(2,10,60,0.45)]"
>
	<header
		class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-light-blue/30 bg-dark-blue/70 px-4 py-3 text-sm text-light-blue"
	>
		<div class="flex flex-wrap items-center gap-6">
			<label
				class="flex items-center gap-2 text-xs tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={isInPerson} name="filter_in_person" value="in-person" required />
				Présentiel
			</label>
			<label
				class="flex items-center gap-2 text-xs tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={isOnline} name="filter_online" value="online" />
				En ligne
			</label>
			<label
				class="flex items-center gap-2 text-xs tracking-[0.28em] text-dark-light-blue uppercase"
			>
				<Checkbox bind:checked={hasSeats} name="filter_has_seats" value="has-seats" />
				Avec de la place
			</label>
		</div>
		<div
			class="grid grid-cols-[min-content_auto_min-content_min-content] items-center gap-3 text-xs tracking-[0.3em] text-dark-light-blue uppercase"
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
			<span class="text-light-blue uppercase">{weekLabel()}</span>
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

	<div
		class="mt-4 grid grid-cols-[repeat(7,1fr)] border border-light-blue/30 bg-dark-blue-gray/20 text-sm tracking-[0.2em] text-light-blue uppercase"
	>
		{#each calendarDays() as day, index}
			<button
				type="button"
				class={`flex items-center justify-center gap-2 border-light-blue/30 px-3 py-3 ${
					index !== 6 ? 'border-r' : ''
				} ${day.isToday ? 'font-bold' : ''}`}
				onclick={() => handleDaySelect(day.date)}
			>
				<span>{weekdays[index]}</span>
				<span>{format(day.date, 'dd/MM')}</span>
			</button>
		{/each}
	</div>

	<div
		class="no-scrollbar flex-1 overflow-y-auto border-x border-b border-light-blue/30 bg-blue-gray/20"
	>
		<div class="grid min-h-full grid-cols-7">
			{#each calendarDays() as day, index}
				<div class={`h-full overflow-hidden border-light-blue/30 ${index !== 6 ? 'border-r' : ''}`}>
					<div class="flex h-full flex-col gap-3 p-4">
						{#each slotsByDay().get(day.key) ?? [] as slot}
							<button type="button" tabindex="0" onclick={() => handleSlotSelect(slot)}>
								<TrainingCard {slot} status={slot.cardStatus} />
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
	<div class="flex gap-5 pt-4 pl-0.5 text-sm tracking-wide">
		<div class="text-light-blue">Légende :</div>
		<div class="text-light-blue">Libre</div>
		<div class="text-registered">Inscrit·e</div>
		<div class="text-waiting">En attente</div>
		<div class="text-blue-peps">Ma formation</div>
		<div class="text-complete">Complète</div>
		<div class="text-dark-blue-gray opacity-55">Annulée</div>
	</div>
</section>

<TrainingSlotModal slot={selectedSlot} open={isModalOpen} onClose={handleModalClose} />

<style>
	.no-scrollbar {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
