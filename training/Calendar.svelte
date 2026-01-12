<script lang="ts">
	import TrainingCard, {
		type TrainingCardStatus
	} from '$lib/components/training/TrainingCard.svelte';
	import Checkbox from '../share/Checkbox.svelte';

	export type CalendarSlot = {
		id: number | string;
		title: string;
		start: Date | string;
		duration_hours: number;
		status?: TrainingCardStatus;
		location?: string;
		registrations?: number | null;
	};

	type CalendarProps = {
		slots?: CalendarSlot[];
		initialDate?: Date;
		onSelectSlot?: (slot: CalendarSlot) => void;
		onSelectDay?: (date: Date) => void;
	};

	const weekdays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

	let { slots = [], initialDate = new Date(), onSelectSlot, onSelectDay }: CalendarProps = $props();

	let isInPerson = $state(false);
	let isOnline = $state(false);
	let hasSeats = $state(false);

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
		for (const slot of slots) {
			const date = new Date(slot.start);
			if (Number.isNaN(date.getTime())) continue;
			const key = toDateKey(date);
			const existing = map.get(key) ?? [];
			existing.push(slot);
			map.set(key, existing);
		}
		return map;
	});

	function toDateKey(date: Date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

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

	function goPrev() {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - 7);
	}

	function goNext() {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 7);
	}

	function goToday() {
		viewDate = new Date();
	}

	function handleSlotSelect(slot: CalendarSlot) {
		onSelectSlot?.(slot);
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
		<div class="flex items-center gap-3 text-xs tracking-[0.3em] text-dark-light-blue uppercase">
			<button
				type="button"
				class="flex size-7 items-center justify-center rounded-md bg-dark-light-blue text-sm leading-none text-main-blue"
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
			</button>
			<span class="text-light-blue uppercase">{weekLabel()}</span>
			<button
				type="button"
				class="flex size-7 items-center justify-center rounded-md bg-dark-light-blue text-sm leading-none text-main-blue"
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
			</button>
			<button
				type="button"
				class="rounded-full border border-blue-peps/60 px-3 py-1 text-[10px] tracking-[0.35em] text-blue-peps uppercase"
				onclick={goToday}
			>
				Aujourd'hui
			</button>
		</div>
	</header>

	<div
		class="mt-4 grid grid-cols-[repeat(7,1fr)] border border-light-blue/30 bg-dark-blue-gray/20 text-xs tracking-[0.2em] text-dark-light-blue uppercase"
	>
		{#each calendarDays() as day, index}
			<button
				type="button"
				class={`flex items-center justify-center gap-2 border-light-blue/30 px-3 py-3 ${
					index !== 6 ? 'border-r' : ''
				} ${day.isToday ? 'text-blue-peps' : ''}`}
				onclick={() => handleDaySelect(day.date)}
			>
				<span>{weekdays[index]}</span>
				<span class="text-light-blue">{day.date.getDate()}</span>
			</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto border-x border-b border-light-blue/30 bg-blue-gray/20">
		<div class="grid min-h-full grid-cols-7">
			{#each calendarDays() as day, index}
				<div class={`h-full overflow-hidden border-light-blue/30 ${index !== 6 ? 'border-r' : ''}`}>
					<div class="flex h-full flex-col gap-3 p-4">
						{#each slotsByDay().get(day.key) ?? [] as slot}
							<div role="button" tabindex="0" onclick={() => handleSlotSelect(slot)}>
								<TrainingCard
									title={slot.title}
									time={formatTimeRange(slot.start, slot.duration_hours)}
									location={slot.location ?? '-'}
									registrations={slot.registrations ?? null}
									status={slot.status}
									showRegistrations={slot.registrations !== null &&
										slot.registrations !== undefined}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
