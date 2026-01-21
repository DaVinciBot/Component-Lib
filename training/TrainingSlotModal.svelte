<script lang="ts">
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import type { TrainingSlotListItem } from '$lib/services/training';
	import { format } from 'date-fns';

	type TrainingSlotView = Omit<TrainingSlotListItem, 'start'> & {
		start: Date | string;
	};

	type AvailabilityMode = {
		key: 'on-site' | 'remote';
		label: string;
		remaining: number;
		isFull: boolean;
	};

	type ActionButton = {
		key: AvailabilityMode['key'];
		label: string;
		variant: 'peps' | 'peps-outline';
	};

	type TrainingSlotModalProps = {
		slot: TrainingSlotView | null;
		open?: boolean;
		onClose?: () => void;
	};

	let { slot = null, open = false, onClose = () => {} }: TrainingSlotModalProps = $props();

	const isOpen = $derived(() => open && slot !== null);

	function formatDate(value: Date | string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '--/--/----';
		return format(date, 'dd/MM/yyyy');
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

	function resolveRemaining(seats: number | null, remaining: number | null) {
		if (seats === null || seats === undefined) return null;
		if (remaining === null || remaining === undefined) return Math.max(seats, 0);
		return Math.max(remaining, 0);
	}

	const availability = $derived((): AvailabilityMode[] => {
		if (!slot) return [];
		const modes: AvailabilityMode[] = [];

		const onSiteRemaining = resolveRemaining(slot.on_site_seats, slot.on_site_remaining);
		if (onSiteRemaining !== null) {
			modes.push({
				key: 'on-site',
				label: 'Présentiel',
				remaining: onSiteRemaining,
				isFull: onSiteRemaining <= 0
			});
		}

		const remoteRemaining = resolveRemaining(slot.remote_seats, slot.remote_remaining);
		if (remoteRemaining !== null) {
			modes.push({
				key: 'remote',
				label: 'Distanciel',
				remaining: remoteRemaining,
				isFull: remoteRemaining <= 0
			});
		}

		return modes;
	});

	const actionButtons = $derived((): ActionButton[] =>
		availability().map((mode) => ({
			key: mode.key,
			label: mode.isFull
				? `Liste d'attente ${mode.label.toLowerCase()}`
				: `S'inscrire ${mode.label.toLowerCase()}`,
			variant: mode.isFull ? 'peps-outline' : 'peps'
		}))
	);
</script>

{#if isOpen()}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center px-6 py-8"
		role="dialog"
		aria-modal="true"
	>
		<button
			type="button"
			class="absolute inset-0 bg-[rgba(4,8,32,0.65)] backdrop-blur-md"
			onclick={onClose}
			aria-label="Fermer"
		></button>
		<section
			class="relative w-full max-w-140 rounded-[22px] border border-light-blue/30 bg-linear-to-b from-[rgba(6,10,44,0.98)] to-[rgba(4,6,26,0.96)] p-6 text-light-blue shadow-[0_26px_70px_rgba(2,6,30,0.6)]"
		>
			<header class="flex items-start justify-between gap-4 border-b border-light-blue/20 pb-4">
				<div>
					<p class="m-0 text-xs tracking-[0.38em] text-dark-light-blue uppercase">
						{slot ? formatDate(slot.start) : ''}
					</p>
					<h2 class="m-0 mt-2 text-2xl font-semibold text-light-blue">
						{slot?.name}
					</h2>
				</div>
				<button
					type="button"
					class="flex size-9 items-center justify-center rounded-full border border-light-blue/30 text-light-blue transition hover:border-light-blue/60"
					onclick={onClose}
					aria-label="Fermer"
				>
					<svg
						class="size-4"
						viewBox="0 0 20 20"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 5l10 10M15 5L5 15" />
					</svg>
				</button>
			</header>
			<div class="mt-5 grid gap-3">
				<div class="grid gap-3 rounded-2xl border border-light-blue/20 bg-blue-gray/20 p-4">
					<div class="grid gap-3 md:grid-cols-2">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
							>
								<svg
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<rect x="3" y="4" width="18" height="18" rx="3" />
									<path d="M8 2v4M16 2v4M3 10h18" />
								</svg>
							</div>
							<div>
								<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
									Date
								</p>
								<p class="m-0 text-sm font-semibold text-light-blue">
									{slot ? formatDate(slot.start) : ''}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
							>
								<svg
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<circle cx="12" cy="12" r="9" />
									<path d="M12 7v5l3 2" />
								</svg>
							</div>
							<div>
								<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
									Heure
								</p>
								<p class="m-0 text-sm font-semibold text-light-blue">
									{slot ? formatTimeRange(slot.start, slot.duration_hours) : ''}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
							>
								<svg
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
									<circle cx="12" cy="10" r="2.5" />
								</svg>
							</div>
							<div>
								<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
									Lieu
								</p>
								<p class="m-0 text-sm font-semibold text-light-blue">
									{slot?.location ?? '-'}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
							>
								<svg
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M20 21c0-3.5-3.6-6.3-8-6.3S4 17.5 4 21" />
									<circle cx="12" cy="9" r="3.2" />
								</svg>
							</div>
							<div>
								<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
									Formateur
								</p>
								<p class="m-0 text-sm font-semibold text-light-blue">
									{slot?.trainer_username ?? '-'}
								</p>
							</div>
						</div>
					</div>
				</div>

				{#if availability().length > 0}
					<div class="rounded-2xl border border-light-blue/20 bg-dark-blue-gray/30 p-4">
						<div
							class="flex items-center gap-2 text-xs tracking-[0.32em] text-dark-light-blue uppercase"
						>
							<svg
								class="size-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M8 7h8M6 11h12M7 15h10" />
							</svg>
							<span>Places</span>
						</div>
						<div class="mt-4 grid gap-3 md:grid-cols-2">
							{#each availability() as mode}
								<div
									class="flex items-center gap-3 rounded-xl border border-light-blue/20 bg-dark-blue/60 p-3"
								>
									<div
										class="flex size-10 items-center justify-center rounded-lg border border-light-blue/30 bg-dark-blue/80"
									>
										{#if mode.key === 'on-site'}
											<svg
												class="size-5"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.6"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M4 10l8-6 8 6v9H4z" />
												<path d="M9 21v-6h6v6" />
											</svg>
										{:else}
											<svg
												class="size-5"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.6"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M4 6h16v10H4z" />
												<path d="M8 18h8" />
											</svg>
										{/if}
									</div>
									<div>
										<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
											{mode.label}
										</p>
										<p class="m-0 text-base font-semibold text-light-blue">
											{mode.isFull ? 'Complet' : `${mode.remaining} places`}
										</p>
										{#if mode.isFull}
											<p class="m-0 text-[0.7rem] text-waiting">Liste d'attente ouverte</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/15 p-4">
					<div
						class="flex items-center gap-2 text-xs tracking-[0.32em] text-dark-light-blue uppercase"
					>
						<svg
							class="size-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
						</svg>
						<span>Note</span>
					</div>
					<p class="mt-3 text-sm leading-relaxed text-light-blue/90">
						{slot?.description ?? 'Aucune note pour cette session.'}
					</p>
				</div>
			</div>
			{#if actionButtons().length > 0}
				<div class="mt-6 grid gap-3 md:grid-cols-2">
					{#each actionButtons() as action}
						<CtaButton type="button" size="sm" variant={action.variant} class="tracking-normal">
							<span class="text-sm font-semibold">{action.label}</span>
						</CtaButton>
					{/each}
				</div>
			{/if}
		</section>
	</div>
{/if}
