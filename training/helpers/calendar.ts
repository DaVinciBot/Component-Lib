export const weekdays: string[] = [
	'Lundi',
	'Mardi',
	'Mercredi',
	'Jeudi',
	'Vendredi',
	'Samedi',
	'Dimanche'
];

export type CalendarSlotLike = {
	start: Date | string;
	on_site_seats?: number | null;
	on_site_remaining?: number | null;
	remote_seats?: number | null;
	remote_remaining?: number | null;
};

export function toDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getWeekStart(date: Date) {
	const dayIndex = (date.getDay() + 6) % 7;
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayIndex);
}

export function getWeekNumber(date: Date) {
	const target = new Date(date.getTime());
	const dayNr = (target.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayNr + 3);
	const firstThursday = new Date(target.getFullYear(), 0, 4);
	const diff = target.getTime() - firstThursday.getTime();
	return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

export function getCalendarDays(weekStart: Date) {
	return Array.from({ length: 7 }, (_, index) => {
		const date = new Date(
			weekStart.getFullYear(),
			weekStart.getMonth(),
			weekStart.getDate() + index
		);
		const key = toDateKey(date);
		return {
			date,
			key,
			isToday: key === toDateKey(new Date())
		};
	});
}

export function isInPersonSlot(slot: CalendarSlotLike) {
	return (slot.on_site_seats ?? 0) > 0 || (slot.on_site_remaining ?? 0) > 0;
}

export function isOnlineSlot(slot: CalendarSlotLike) {
	return (slot.remote_seats ?? 0) > 0 || (slot.remote_remaining ?? 0) > 0;
}

export function filterSlotsByFormat<T extends CalendarSlotLike>(
	slots: T[],
	filters: { inPerson: boolean; online: boolean }
) {
	const filterByFormat = filters.inPerson || filters.online;
	return slots.filter((slot) => {
		const matchesFormat =
			!filterByFormat ||
			(filters.inPerson && isInPersonSlot(slot)) ||
			(filters.online && isOnlineSlot(slot));
		return matchesFormat;
	});
}

export function groupSlotsByDay<T extends CalendarSlotLike>(slots: T[]) {
	const map = new Map<string, T[]>();
	for (const slot of slots) {
		const date = new Date(slot.start);
		if (Number.isNaN(date.getTime())) continue;
		const key = toDateKey(date);
		const existing = map.get(key) ?? [];
		existing.push(slot);
		map.set(key, existing);
	}
	return map;
}
