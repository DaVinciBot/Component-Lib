<script lang="ts">
	import RecoveryCodesModal from '$lib/components/modals/RecoveryCodesModal.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import { formatParisDateTimeShort } from '$lib/helpers/parisTime';
	import {
		disableMfaMethod,
		fetchMfaState,
		regenerateRecoveryCodes,
		startEmailEnrollment,
		verifyEmailEnrollment,
		type MfaState
	} from '$lib/settings/mfa';
	import { withStepUp } from '$lib/settings/stepUp';
	import { KeyRound, Mail } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let mfaState = $state<MfaState | null>(null);
	let loading = $state<boolean>(true);
	let loadError = $state<string | null>(null);
	let busy = $state<boolean>(false);
	let enrolling = $state<boolean>(false);
	let enrollCode = $state('');
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
			await withStepUp(() => startEmailEnrollment());
			enrollCode = '';
			enrolling = true;
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
		}
		busy = false;
	}

	async function handleVerifyEnrollment(e: SubmitEvent) {
		e.preventDefault();
		if (!enrollCode) {
			return;
		}
		busy = true;
		try {
			const codes = await withStepUp(() => verifyEmailEnrollment(enrollCode));
			enrolling = false;
			recoveryCodes = codes;
			await load();
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
		}
		busy = false;
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
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
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
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
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
	{:else if emailMethod}
		<div
			class="border-light-blue/10 bg-dark-blue/40 mb-3 flex items-center gap-3 rounded-xl border p-3"
		>
			<Mail class="text-dark-light-blue size-5 shrink-0" />
			<div class="min-w-0 flex-1">
				<p class="text-light-blue m-0 text-sm font-medium">Code par e-mail</p>
				<p class="text-dark-light-blue/80 m-0 truncate text-xs">
					Activée le {formatParisDateTimeShort(emailMethod.created_at)}
					{#if emailMethod.last_used_at}
						· Dernière utilisation {formatParisDateTimeShort(emailMethod.last_used_at)}
					{/if}
				</p>
			</div>
			<button
				id="mfa-disable-email"
				type="button"
				class="shrink-0 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={busy}
				onclick={() => void handleDisable()}
			>
				Désactiver
			</button>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2">
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
				Régénérer les codes
			</CtaButton>
		</div>
	{:else if enrolling}
		<p class="text-light-blue m-0 mb-3 text-sm">
			Saisis le code à 6 chiffres reçu par e-mail (le dernier code reçu reste valable).
		</p>
		<form class="flex flex-wrap items-center gap-2" onsubmit={handleVerifyEnrollment}>
			<input
				type="text"
				id="mfa-enroll-code"
				aria-label="Code de vérification"
				inputmode="numeric"
				pattern="[0-9]*"
				maxlength="6"
				autocomplete="one-time-code"
				placeholder="123456"
				class="border-light-blue/30 bg-dark-blue/60 text-light-blue placeholder:text-dark-light-blue/50 focus:border-light-blue/70 block w-40 rounded-xl border p-2.5 text-center font-mono text-sm tracking-[0.4em] focus:outline-none disabled:opacity-50"
				disabled={busy}
				bind:value={enrollCode}
			/>
			<CtaButton type="submit" variant="secondary" size="sm" fullWidth={false} disabled={busy}>
				{busy ? 'Chargement…' : 'Valider'}
			</CtaButton>
			<button
				type="button"
				class="text-dark-light-blue cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm hover:underline"
				disabled={busy}
				onclick={() => (enrolling = false)}
			>
				Annuler
			</button>
		</form>
	{:else}
		<p class="text-dark-light-blue m-0 mb-3 text-sm">
			Ajoute une deuxième étape à la connexion : un code à 6 chiffres envoyé par e-mail te sera
			demandé, avec des codes de récupération à usage unique en secours.
		</p>
		<CtaButton
			id="mfa-enable-email"
			variant="secondary"
			size="sm"
			fullWidth={false}
			disabled={busy}
			onclick={() => void handleEnable()}
		>
			Activer la vérification par e-mail
		</CtaButton>
	{/if}

	{#if recoveryCodes}
		<RecoveryCodesModal codes={recoveryCodes} onClose={() => (recoveryCodes = null)} />
	{/if}
</section>
