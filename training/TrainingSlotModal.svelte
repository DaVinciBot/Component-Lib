<script lang="ts">
	import { goto } from '$app/navigation';
	import type { CalendarSlot } from '$lib/components/training/Calendar.svelte';
	import TrainingRegistrationPopup from '$lib/components/training/TrainingRegistrationPopup.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import {
		cancelRegistration,
		getMyRegistrationForSlot,
		getSlotRegistrations,
		getTrainerSlotRegistrations,
		registerToSlot,
		updateMyRegistrationExcuse,
		type RegistrationListItem,
		type RegistrationSummary
	} from '$lib/services/training';
	import {
		Armchair,
		Calendar,
		Clock,
		House,
		LaptopMinimal,
		MapPin,
		MessageSquare,
		MoveUpRight,
		TextAlignStart,
		UserRound,
		Users,
		Video,
		X
	} from '@lucide/svelte';
	import { format } from 'date-fns';

	type AvailabilityMode = {
		key: 'on-site' | 'remote';
		label: string;
		remaining: number;
		isFull: boolean;
	};

	type ActionButton = {
		key: AvailabilityMode['key'];
		label: string;
		variant: 'primary' | 'secondary';
		isCancel?: boolean;
	};

	type TrainingSlotModalProps = {
		slot: CalendarSlot | null;
		open?: boolean;
		onClose?: () => void;
		onRegistrationChange?: () => void;
		canManageTraining?: boolean;
	};

	let {
		slot = null,
		open = false,
		onClose = () => {},
		onRegistrationChange,
		canManageTraining = false
	}: TrainingSlotModalProps = $props();
	let registration = $state<RegistrationSummary | null>(null);
	let registrationRequestId = 0;
	let participants = $state<RegistrationListItem[]>([]);
	let participantsLoading = $state(false);
	let participantsError = $state<string | null>(null);
	let participantsRequestId = 0;
	let confirmOpen = $state(false);
	let confirmMode = $state<AvailabilityMode['key'] | null>(null);
	let confirmLoading = $state(false);
	let excuseUpdating = $state(false);

	const isOpen = $derived(() => open && slot !== null);
	const hasDescription = $derived(() => hasContent(slot?.description));
	const hasPrerequisites = $derived(() => hasContent(slot?.prerequisites));
	const hasVideoLink = $derived(
		() =>
			hasContent(slot?.video_conference_link) &&
			((registration?.status === 'registered' && registration.remote) || slot?.cardStatus === 'my')
	);
	const isWaitlisted = $derived(() => registration?.status === 'waitlisted');
	const confirmLabel = $derived(() => (confirmLoading ? 'Inscription...' : "S'inscrire"));
	const showExcuseToggle = $derived(() => slot?.excusable && registration?.status === 'registered');
	const excuseToggleLabel = $derived(() =>
		registration?.to_excuse ? "Je n'ai plus besoin d'excuse" : "J'ai besoin d'une excuse"
	);
	const canViewParticipants = $derived(
		() => slot?.cardStatus === 'my' || Boolean(canManageTraining)
	);

	function isRegistrationMode(modeKey: AvailabilityMode['key']) {
		if (!registration) return false;
		return registration.remote ? modeKey === 'remote' : modeKey === 'on-site';
	}

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
		if (slot?.cardStatus === 'hidden' || slot?.cardStatus === 'my') return [];
		if (registration) {
			return [
				{
					key: registration.remote ? 'remote' : 'on-site',
					label:
						registration.status === 'waitlisted'
							? "Se retirer de la liste d'attente"
							: 'Se désinscrire',
					variant: 'primary',
					isCancel: true
				}
			];
		}
		return availability().map((mode) => ({
			key: mode.key,
			label: mode.isFull
				? `Sur liste d'attente (${mode.label.toLowerCase()})`
				: `S'inscrire (${mode.label.toLowerCase()})`,
			variant: mode.isFull ? 'secondary' : 'primary'
		}));
	});

	const actionCount = $derived(() => actionButtons().length + (showExcuseToggle() ? 1 : 0));

	async function refreshRegistration() {
		if (!slot) return;
		const currentRequest = ++registrationRequestId;
		try {
			const data = await getMyRegistrationForSlot(slot.slot_id);
			if (currentRequest !== registrationRequestId) return;
			registration = data;
		} catch (err) {
			if (currentRequest !== registrationRequestId) return;
			registration = null;
		}
	}

	async function refreshParticipants() {
		if (!slot || !canViewParticipants()) return;
		const currentRequest = ++participantsRequestId;
		participantsLoading = true;
		participantsError = null;
		try {
			const data = canManageTraining
				? await getSlotRegistrations(slot.slot_id)
				: await getTrainerSlotRegistrations(slot.slot_id);
			if (currentRequest !== participantsRequestId) return;
			participants = data;
		} catch (err) {
			if (currentRequest !== participantsRequestId) return;
			participantsError = 'Impossible de charger les inscriptions.';
			participants = [];
		} finally {
			if (currentRequest === participantsRequestId) {
				participantsLoading = false;
			}
		}
	}

	function openConfirmation(mode: AvailabilityMode['key']) {
		confirmMode = mode;
		confirmOpen = true;
	}

	function closeConfirmation() {
		confirmOpen = false;
		confirmMode = null;
	}

	async function handleConfirmRegistration(toExcuse: boolean) {
		if (!slot || !confirmMode) return;
		confirmLoading = true;
		try {
			await registerToSlot(slot.slot_id, confirmMode === 'remote', toExcuse);
			await refreshRegistration();
			onRegistrationChange?.();
		} catch (err) {
			console.error(err);
		} finally {
			confirmLoading = false;
			closeConfirmation();
		}
	}

	async function handleCancelRegistration() {
		if (!slot) return;
		try {
			await cancelRegistration(slot.slot_id);
			await refreshRegistration();
			onRegistrationChange?.();
		} catch (err) {
			console.error(err);
		}
	}

	async function handleExcuseToggle() {
		if (!slot || !registration) return;
		excuseUpdating = true;
		try {
			const nextValue = !registration.to_excuse;
			await updateMyRegistrationExcuse(slot.slot_id, nextValue);
			await refreshRegistration();
			onRegistrationChange?.();
		} catch (err) {
			console.error(err);
		} finally {
			excuseUpdating = false;
		}
	}

	function handleActionClick(action: ActionButton) {
		if (confirmLoading) return;
		if (action.isCancel) {
			handleCancelRegistration();
			return;
		}
		openConfirmation(action.key);
	}

	$effect(() => {
		if (!open || !slot) {
			registration = null;
			participants = [];
			participantsError = null;
			participantsLoading = false;
			closeConfirmation();
			return;
		}
		refreshRegistration();
		refreshParticipants();
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
			class="relative max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-140 overflow-hidden rounded-[22px] border border-light-blue/30 bg-linear-to-b from-[rgba(6,10,44,0.98)] to-[rgba(4,6,26,0.96)] text-light-blue shadow-[0_26px_70px_rgba(2,6,30,0.6)]"
		>
			<div class="max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-6">
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
							<div class="mt-4 grid gap-3 md:grid-cols-2">
								{#each availability() as mode}
									<div
										class={`flex items-center gap-3 rounded-xl border p-3 ${
											registration && isRegistrationMode(mode.key)
												? isWaitlisted()
													? 'border-waiting/40 bg-waiting/10 text-waiting'
													: 'border-registered/30 bg-registered/10 text-registered'
												: 'border-light-blue/20 bg-dark-blue/60 text-dark-light-blue'
										}`}
									>
										<div
											class="flex size-10 items-center justify-center rounded-lg border border-light-blue/30 bg-dark-blue/80 text-dark-light-blue"
										>
											{#if mode.key === 'on-site'}
												<House />
											{:else}
												<LaptopMinimal />
											{/if}
										</div>
										<div>
											<p class="m-0 text-[0.6rem] tracking-[0.32em] uppercase">
												{mode.label}
											</p>
											{#if registration && isRegistrationMode(mode.key)}
												<p class="m-0 font-semibold">
													{isWaitlisted() ? "Sur liste d'attente" : 'Inscrit·e'}
												</p>
											{:else if mode.isFull}
												<p class="m-0 text-[0.9rem] text-waiting">Liste d'attente ouverte</p>
											{:else}
												<p class="m-0 font-semibold">
													{`${mode.remaining} ${mode.remaining > 1 ? 'places restantes' : 'place restante'}`}
												</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if canViewParticipants()}
						<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/15 p-4">
							<div
								class="flex items-center gap-2 text-xs tracking-[0.32em] text-dark-light-blue uppercase"
							>
								<Users class="size-4" />
								<span>Participant·e·s</span>
							</div>
							{#if participantsLoading}
								<p class="mt-3 text-sm text-light-blue/70">Chargement des inscrit·e·s...</p>
							{:else if participantsError}
								<p class="mt-3 text-sm text-waiting">{participantsError}</p>
							{:else if participants.length === 0}
								<p class="mt-3 text-sm text-light-blue/70">Aucun·e inscrit·e pour le moment.</p>
							{:else}
								<div class="mt-3 grid gap-2 sm:grid-cols-2">
									{#each participants as reg}
										<div
											class={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
												reg.status === 'waitlisted'
													? 'border-waiting/40 bg-waiting/10 text-waiting'
													: reg.remote
														? 'border-blue-peps/40 bg-blue-peps/10'
														: 'border-registered/30 bg-registered/10'
											}`}
										>
											{#if reg.member_avatar_url}
												<img
													src={reg.member_avatar_url}
													alt={reg.member_username ?? 'Membre'}
													class="size-9 rounded-full border border-light-blue/20 object-cover"
												/>
											{:else}
												<div
													class="flex size-9 items-center justify-center rounded-full border border-light-blue/20 bg-dark-blue/70 text-xs font-semibold text-light-blue/80"
												>
													{(reg.member_username ?? '?').charAt(0).toUpperCase()}
												</div>
											{/if}
											<div class="min-w-0 flex-1">
												<p class="m-0 truncate text-sm font-semibold text-light-blue">
													{reg.member_username ?? 'Membre'}
												</p>
												<p class="m-0 text-[0.7rem] text-light-blue/70">
													{reg.remote ? 'Distanciel' : 'Présentiel'}
												</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
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
								class="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-light-blue transition hover:text-blue-peps"
							>
								<span>Rejoindre la session en ligne</span>
								<MoveUpRight class="size-4" />
							</a>
						</div>
					{/if}
				</div>

				{#if actionCount() > 0}
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						{#if showExcuseToggle()}
							<CtaButton
								type="button"
								size="sm"
								variant="secondary"
								onclick={handleExcuseToggle}
								disabled={confirmLoading || excuseUpdating}
							>
								{excuseUpdating ? 'Mise à jour...' : excuseToggleLabel()}
							</CtaButton>
						{/if}
						{#each actionButtons() as action}
							<CtaButton
								type="button"
								size="sm"
								variant={action.variant}
								onclick={() => handleActionClick(action)}
								disabled={confirmLoading || excuseUpdating}
								class={actionCount() === 1 ? 'w-auto justify-self-end md:col-start-2' : ''}
								>{action.label}
							</CtaButton>
						{/each}
					</div>
				{:else if slot?.cardStatus === 'my'}
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<CtaButton
							type="button"
							size="sm"
							variant="secondary"
							onclick={() => goto('presences')}
							class="w-auto justify-self-end md:col-start-2"
							>Gérer les présences
						</CtaButton>
					</div>
				{/if}
			</div>
		</section>
	</div>
{/if}

<TrainingRegistrationPopup
	open={confirmOpen}
	trainingName={slot?.name ?? 'Titre'}
	showExcuse={slot?.excusable ?? true}
	confirmLabel={confirmLabel()}
	confirmDisabled={confirmLoading}
	onConfirm={handleConfirmRegistration}
	onCancel={closeConfirmation}
/>
