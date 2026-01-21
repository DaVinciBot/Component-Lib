<script lang="ts">
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import {
		getMyRegistrationForSlot,
		type RegistrationSummary,
		type TrainingSlotListItem
	} from '$lib/services/training';
	import {
		Armchair,
		Calendar,
		Check,
		Clock,
		House,
		LaptopMinimal,
		MapPin,
		MessageSquare,
		MoveUpRight,
		TextAlignStart,
		UserRound,
		Video,
		X
	} from '@lucide/svelte';
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
	let registration = $state<RegistrationSummary | null>(null);
	let registrationRequestId = 0;

	const isOpen = $derived(() => open && slot !== null);
	const hasDescription = $derived(() => hasContent(slot?.description));
	const hasPrerequisites = $derived(() => hasContent(slot?.prerequisites));
	const hasVideoLink = $derived(() => hasContent(slot?.video_conference_link));
	const registrationModeLabel = $derived(() =>
		registration?.remote ? 'distanciel' : 'présentiel'
	);
	const isRegistered = $derived(() => registration?.status === 'registered');
	const isWaitlisted = $derived(() => registration?.status === 'waitlisted');

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

	function hasContent(value?: string | null) {
		if (!value) return false;
		return value.trim().length > 0;
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

	const actionButtons = $derived((): ActionButton[] => {
		if (registration) {
			return [
				{
					key: registration.remote ? 'remote' : 'on-site',
					label:
						registration.status === 'waitlisted'
							? "Se désinscrire de la liste d'attente"
							: 'Se désinscrire',
					variant: 'peps-outline'
				}
			];
		}
		return availability().map((mode) => ({
			key: mode.key,
			label: mode.isFull
				? `Liste d'attente ${mode.label.toLowerCase()}`
				: `S'inscrire ${mode.label.toLowerCase()}`,
			variant: mode.isFull ? 'peps-outline' : 'peps'
		}));
	});

	$effect(() => {
		if (!open || !slot) {
			registration = null;
			return;
		}
		const currentRequest = ++registrationRequestId;
		getMyRegistrationForSlot(slot.slot_id)
			.then((data) => {
				if (currentRequest !== registrationRequestId) return;
				registration = data;
			})
			.catch(() => {
				if (currentRequest !== registrationRequestId) return;
				registration = null;
			});
	});
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
					<X class="size-5.5" />
				</button>
			</header>
			<div class="mt-5 grid gap-3">
				<div class="grid gap-3 rounded-2xl border border-light-blue/20 bg-blue-gray/20 p-4">
					<div class="grid gap-3 md:grid-cols-2">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl border border-light-blue/30 bg-dark-blue/70"
							>
								<Calendar class="size-5.5" />
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
								<Clock class="size-5.5" />
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
								<MapPin class="size-5.5" />
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
								<UserRound class="size-5.5" />
							</div>
							<div>
								<p class="m-0 text-[0.6rem] tracking-[0.32em] text-dark-light-blue uppercase">
									Formateur·ice
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
							<Armchair class="size-4" />
							<span>Places</span>
						</div>
						{#if registration}
							<div
								class={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
									isWaitlisted()
										? 'border-waiting/40 bg-waiting/10 text-waiting'
										: 'border-registered/30 bg-registered/10 text-registered'
								}`}
							>
								<Check class="size-3.5" />
								<span>
									{isWaitlisted()
										? `Sur liste d'attente (${registrationModeLabel()})`
										: `Inscrit·e en ${registrationModeLabel()}`}
								</span>
							</div>
						{/if}
						<div class="mt-4 grid gap-3 md:grid-cols-2">
							{#each availability() as mode}
								<div
									class="flex items-center gap-3 rounded-xl border border-light-blue/20 bg-dark-blue/60 p-3"
								>
									<div
										class="flex size-10 items-center justify-center rounded-lg border border-light-blue/30 bg-dark-blue/80"
									>
										{#if mode.key === 'on-site'}
											<House />
										{:else}
											<LaptopMinimal />
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

				{#if hasDescription()}
					<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/15 p-4">
						<div
							class="flex items-center gap-2 text-xs tracking-[0.32em] text-dark-light-blue uppercase"
						>
							<MessageSquare class="size-4" />
							<span>Description</span>
						</div>
						<p class="mt-3 text-sm leading-relaxed text-light-blue/90">
							{@html slot?.description ?? ''}
						</p>
					</div>
				{/if}

				{#if hasPrerequisites()}
					<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/15 p-4">
						<div
							class="flex items-center gap-2 text-xs tracking-[0.32em] text-dark-light-blue uppercase"
						>
							<TextAlignStart class="size-4" />
							<span>Prérequis</span>
						</div>
						<p class="mt-3 text-sm leading-relaxed text-light-blue/90">
							{@html slot?.prerequisites ?? ''}
						</p>
					</div>
				{/if}

				{#if hasVideoLink()}
					<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/15 p-4">
						<div
							class="flex items-center gap-2 text-xs tracking-[0.32em] text-dark-light-blue uppercase"
						>
							<Video class="size-4" />
							<span>Lien distanciel</span>
						</div>
						<a
							href={slot?.video_conference_link ?? '#'}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-light-blue transition hover:text-blue-peps"
						>
							<span>Rejoindre la session en ligne</span>
							<MoveUpRight class="size-4" />
						</a>
					</div>
				{/if}
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
