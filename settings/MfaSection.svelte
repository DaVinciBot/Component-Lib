<script lang="ts">
	import RecoveryCodesModal from '$lib/components/modals/RecoveryCodesModal.svelte';
	import CodeInput from '$lib/components/utils/CodeInput.svelte';
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
	{:else}
		<div class="border-light-blue/10 bg-dark-blue/40 flex items-center gap-3 rounded-xl border p-3">
			<Mail class="text-dark-light-blue size-5 shrink-0" />
			<div class="min-w-0 flex-1">
				<p class="text-light-blue m-0 text-sm font-medium">Code par e-mail</p>
				<p class="text-dark-light-blue/80 m-0 truncate text-xs">
					{#if emailMethod}
						Activée le {formatParisDateTimeShort(emailMethod.created_at)}
						{#if emailMethod.last_used_at}
							· Dernière utilisation {formatParisDateTimeShort(emailMethod.last_used_at)}
						{/if}
					{:else}
						Un code à 6 chiffres te sera demandé à la connexion.
					{/if}
				</p>
			</div>
			{#if emailMethod}
				<button
					id="mfa-disable-email"
					type="button"
					class="shrink-0 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={busy}
					onclick={() => void handleDisable()}
				>
					{busy ? 'Chargement…' : 'Désactiver'}
				</button>
			{:else}
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
			{/if}
		</div>

		{#if !emailMethod && enrolling}
			<div class="border-light-blue/10 bg-dark-blue/40 mt-3 rounded-xl border p-3">
				<p class="text-light-blue m-0 mb-3 text-sm">
					{enrollEmail
						? `Saisis le code à 6 chiffres envoyé à ${enrollEmail}.`
						: 'Saisis le code à 6 chiffres reçu par e-mail.'}
				</p>
				<form class="grid gap-3" onsubmit={handleVerifyEnrollment}>
					<CodeInput id="mfa-enroll-code" bind:value={enrollCode} disabled={busy} />
					<div class="flex items-center gap-2">
						<CtaButton
							type="submit"
							variant="secondary"
							size="sm"
							fullWidth={false}
							disabled={busy}
						>
							{busy ? 'Vérification…' : 'Valider'}
						</CtaButton>
						<button
							type="button"
							class="text-dark-light-blue cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm hover:underline"
							disabled={busy}
							onclick={() => (enrolling = false)}
						>
							Annuler
						</button>
					</div>
				</form>
			</div>
		{/if}

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

	{#if recoveryCodes}
		<RecoveryCodesModal codes={recoveryCodes} onClose={() => (recoveryCodes = null)} />
	{/if}
</section>
