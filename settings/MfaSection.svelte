<script lang="ts">
	import MfaEnrollModal from '$lib/components/modals/MfaEnrollModal.svelte';
	import RecoveryCodesModal from '$lib/components/modals/RecoveryCodesModal.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import {
		disableMfaMethod,
		fetchMfaState,
		regenerateRecoveryCodes,
		startEmailEnrollment,
		type MfaState
	} from '$lib/settings/mfa';
	import { alertUnlessCancelled, withStepUp } from '$lib/settings/stepUp';
	import { KeyRound, Mail } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let mfaState = $state<MfaState | null>(null);
	let loading = $state<boolean>(true);
	let loadError = $state<string | null>(null);
	let busy = $state<boolean>(false);
	let enrolling = $state<boolean>(false);
	let enrollEmail = $state<string | null>(null);
	let recoveryCodes = $state<string[] | null>(null);

	const emailMethod = $derived(
		mfaState?.methods.find((method) => method.method_type === 'email') ?? null
	);

	async function load() {
		loading = true;
		loadError = null;
		try {
			mfaState = await fetchMfaState();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		loading = false;
	}

	onMount(() => {
		void load();
	});

	async function handleEnable() {
		busy = true;
		try {
			enrollEmail = await withStepUp(() => startEmailEnrollment());
			enrolling = true;
		} catch (error) {
			alertUnlessCancelled(error);
		}
		busy = false;
	}

	function handleVerified(codes: string[] | null) {
		enrolling = false;
		recoveryCodes = codes;
		void load();
	}

	async function handleDisable() {
		const method = emailMethod;
		if (!method) {
			return;
		}
		if (
			!window.confirm(
				'Désactiver la vérification par e-mail ? Tes codes de récupération et appareils de confiance seront supprimés.'
			)
		) {
			return;
		}
		busy = true;
		try {
			await withStepUp(() => disableMfaMethod(method.id));
			await load();
		} catch (error) {
			alertUnlessCancelled(error);
		}
		busy = false;
	}

	async function handleRegenerate() {
		if (
			!window.confirm('Régénérer les codes de récupération ? Les anciens ne fonctionneront plus.')
		) {
			return;
		}
		busy = true;
		try {
			recoveryCodes = await withStepUp(() => regenerateRecoveryCodes());
			await load();
		} catch (error) {
			alertUnlessCancelled(error);
		}
		busy = false;
	}
</script>

<section
	id="mfa-section"
	class="border-light-blue/20 bg-blue-gray/15 rounded-2xl border p-4 sm:p-5"
>
	<p class="text-dark-light-blue m-0 mb-3 text-[0.65rem] tracking-[0.32em] uppercase">
		Vérification en deux étapes
	</p>
	{#if loading}
		<p class="text-dark-light-blue m-0 text-sm">Chargement…</p>
	{:else if loadError}
		<p class="m-0 mb-3 text-sm text-red-400">{loadError}</p>
		<CtaButton variant="secondary" size="sm" fullWidth={false} onclick={() => void load()}>
			Réessayer
		</CtaButton>
	{:else}
		<div
			class="border-light-blue/10 bg-dark-blue/40 flex flex-wrap items-center gap-3 rounded-xl border p-3"
		>
			<Mail class="text-dark-light-blue size-5 shrink-0" />
			<div class="min-w-0 flex-1 basis-48">
				<p class="text-light-blue m-0 text-sm font-medium">Code par e-mail</p>
				<p class="text-dark-light-blue/80 m-0 text-xs">
					Un code à 6 chiffres te sera demandé à la connexion.
				</p>
			</div>
			{#if emailMethod}
				<button
					id="mfa-disable-email"
					type="button"
					class="ml-auto shrink-0 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={busy}
					onclick={() => void handleDisable()}
				>
					{busy ? 'Chargement…' : 'Désactiver'}
				</button>
			{:else}
				<div class="ml-auto shrink-0">
					<CtaButton
						id="mfa-enable-email"
						variant="secondary"
						size="sm"
						fullWidth={false}
						disabled={busy || enrolling}
						onclick={() => void handleEnable()}
					>
						{busy ? 'Envoi…' : 'Activer'}
					</CtaButton>
				</div>
			{/if}
		</div>

		{#if emailMethod}
			<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
				<p class="text-dark-light-blue m-0 flex items-center gap-1.5 text-xs">
					<KeyRound class="size-4 shrink-0" />
					{mfaState?.recovery_codes_remaining ?? 0} codes de récupération restants
				</p>
				<CtaButton
					variant="secondary"
					size="sm"
					fullWidth={false}
					disabled={busy}
					onclick={() => void handleRegenerate()}
				>
					{busy ? 'Génération…' : 'Régénérer les codes'}
				</CtaButton>
			</div>
		{/if}
	{/if}

	{#if enrolling}
		<MfaEnrollModal
			email={enrollEmail}
			onClose={() => (enrolling = false)}
			onVerified={handleVerified}
		/>
	{/if}

	{#if recoveryCodes}
		<RecoveryCodesModal codes={recoveryCodes} onClose={() => (recoveryCodes = null)} />
	{/if}
</section>
