<script lang="ts">
	import { onMount } from 'svelte';
	import Checkbox from '../share/Checkbox.svelte';
	import CodeInput from '../utils/CodeInput.svelte';

	// Style des cases aligné sur le formulaire de connexion (le défaut du
	// composant partagé porte le thème de l'espace admin).
	const CODE_CELL_CLASS =
		'border-dark-blue-gray text-dark-light-blue h-10 w-8 rounded-lg border-2 bg-transparent text-center font-mono text-base focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 min-[450px]:h-12 min-[450px]:w-10 min-[450px]:text-lg';

	type ChallengeMode = 'email' | 'totp' | 'recovery' | 'webauthn';

	/** Routes de la cérémonie MFA, côté hôte. Les défauts sont ceux d'auth. */
	interface MfaChallengeEndpoints {
		verify: string;
		webauthnOptions: string;
		resend: string;
	}

	const DEFAULT_ENDPOINTS: MfaChallengeEndpoints = {
		verify: '/login/mfa/verify',
		webauthnOptions: '/login/mfa/webauthn/options',
		resend: '/login/mfa/resend'
	};

	interface Props {
		ticket: string;
		email?: string | null;
		methods?: string[];
		defaultMethod?: string;
		redirect?: string | null;
		showMethodToggle?: boolean;
		chooserOpen?: boolean;
		/** À surcharger si l'hôte expose la cérémonie MFA sous d'autres chemins. */
		endpoints?: MfaChallengeEndpoints;
		onSuccess: (redirect: string) => void;
		onRestart: (message: string) => void;
	}

	/* eslint-disable prefer-const -- chooserOpen est $bindable, la déstructuration doit rester let */
	let {
		ticket,
		email = null,
		methods = ['email'],
		defaultMethod = 'email',
		redirect = null,
		showMethodToggle = true,
		chooserOpen = $bindable(false),
		endpoints = DEFAULT_ENDPOINTS,
		onSuccess,
		onRestart
	}: Props = $props();
	/* eslint-enable prefer-const */

	// Capture volontaire de la valeur initiale : le composant est recréé à chaque challenge.
	// svelte-ignore state_referenced_locally
	let mode = $state<ChallengeMode>(
		defaultMethod === 'totp' || defaultMethod === 'webauthn' ? defaultMethod : 'email'
	);
	// svelte-ignore state_referenced_locally
	let emailSent = $state(defaultMethod !== 'totp' && defaultMethod !== 'webauthn');
	let code = $state('');
	let recoveryCode = $state('');
	let trustDevice = $state(false);
	let loading = $state(false);
	let resending = $state(false);
	let errorMessage = $state('');
	let resendCooldown = $state(0);

	let cooldownTimer: ReturnType<typeof setInterval> | null = null;

	const otherModes = $derived(
		(
			[
				{ id: 'webauthn', label: 'Passkey' },
				{ id: 'email', label: 'Code reçu par e-mail' },
				{ id: 'totp', label: "Application d'authentification" },
				{ id: 'recovery', label: 'Code de récupération' }
			] as { id: ChallengeMode; label: string }[]
		).filter(
			(option) => option.id !== mode && (option.id === 'recovery' || methods.includes(option.id))
		)
	);

	function startCooldown(seconds: number) {
		resendCooldown = seconds;
		if (cooldownTimer) {
			clearInterval(cooldownTimer);
		}
		cooldownTimer = setInterval(() => {
			resendCooldown -= 1;
			if (resendCooldown <= 0 && cooldownTimer) {
				clearInterval(cooldownTimer);
				cooldownTimer = null;
			}
		}, 1000);
	}

	onMount(() => {
		// Un code vient d'être envoyé par le login quand la méthode par défaut est l'email.
		if (emailSent) {
			startCooldown(30);
		}
		// Tentative immédiate quand la passkey est la méthode par défaut ; le
		// bouton reste là si le navigateur exige un geste utilisateur (Safari).
		if (mode === 'webauthn') {
			void handlePasskey();
		}
		return () => {
			if (cooldownTimer) {
				clearInterval(cooldownTimer);
			}
		};
	});

	function chooseMode(next: ChallengeMode) {
		mode = next;
		chooserOpen = false;
		errorMessage = '';
		code = '';
		if (next === 'email' && !emailSent) {
			// Premier envoi réel : le ticket a été créé sans envoi d'email.
			void handleResend();
		}
		if (next === 'webauthn') {
			void handlePasskey();
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		errorMessage = '';

		const body =
			mode === 'recovery'
				? { ticket, recovery_code: recoveryCode, trust_device: trustDevice, redirect }
				: { ticket, code, method: mode, trust_device: trustDevice, redirect };
		const response = await fetch(endpoints.verify, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const result = (await response.json().catch(() => ({}))) as {
			ok?: boolean;
			redirect?: string;
			error?: string;
		};

		if (response.ok && result.ok) {
			onSuccess(result.redirect ?? '/');
			return;
		}
		if (response.status === 410) {
			onRestart('Trop de tentatives. Reconnecte-toi pour recevoir un nouveau code.');
			return;
		}
		errorMessage =
			response.status === 429
				? 'Trop de tentatives, réessaie dans quelques minutes.'
				: mode === 'recovery'
					? 'Code de récupération invalide.'
					: 'Code invalide.';
		loading = false;
	}

	async function handlePasskey() {
		if (loading) {
			return;
		}
		loading = true;
		errorMessage = '';
		try {
			const optionsResponse = await fetch(endpoints.webauthnOptions, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticket })
			});
			const optionsResult = (await optionsResponse.json().catch(() => ({}))) as {
				ok?: boolean;
				options?: unknown;
			};
			if (optionsResponse.status === 401) {
				onRestart('La session de vérification a expiré. Reconnecte-toi.');
				return;
			}
			if (!optionsResponse.ok || !optionsResult.ok || !optionsResult.options) {
				errorMessage = 'Vérification par passkey impossible.';
				loading = false;
				return;
			}
			const { startAuthentication } = await import('@simplewebauthn/browser');
			const credential = await startAuthentication({
				optionsJSON: optionsResult.options as Parameters<
					typeof startAuthentication
				>[0]['optionsJSON']
			});
			const response = await fetch(endpoints.verify, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticket,
					method: 'webauthn',
					webauthn_response: credential,
					trust_device: trustDevice,
					redirect
				})
			});
			const result = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				redirect?: string;
			};
			if (response.ok && result.ok) {
				onSuccess(result.redirect ?? '/');
				return;
			}
			if (response.status === 410) {
				onRestart('Trop de tentatives. Reconnecte-toi.');
				return;
			}
			errorMessage =
				response.status === 429
					? 'Trop de tentatives, réessaie dans quelques minutes.'
					: 'Vérification par passkey impossible.';
		} catch (error) {
			// Annulation du prompt par l'utilisateur : pas un échec à afficher.
			if (!(error instanceof Error && error.name === 'NotAllowedError')) {
				errorMessage = 'Vérification par passkey impossible.';
			}
		}
		loading = false;
	}

	async function handleResend() {
		errorMessage = '';
		resending = true;
		const response = await fetch(endpoints.resend, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ticket })
		});
		const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
		resending = false;
		if (response.ok && result.ok) {
			emailSent = true;
			code = '';
			startCooldown(30);
			return;
		}
		if (response.status === 401) {
			onRestart('La session de vérification a expiré. Reconnecte-toi.');
			return;
		}
		errorMessage = result.error ?? "L'envoi a échoué. Réessaie.";
		startCooldown(30);
	}
</script>

<div class="space-y-4 md:space-y-6">
	<h1 class="text-xl leading-tight font-bold tracking-tight text-white md:text-2xl">
		Vérification en deux étapes
	</h1>

	{#if chooserOpen}
		<p class="text-dark-light-blue text-sm">Choisis une autre méthode de vérification.</p>
		<div class="grid gap-3">
			{#each otherModes as option (option.id)}
				<button
					type="button"
					class="hover:bg-dark-light-blue hover:text-dark-blue text-dark-light-blue border-dark-blue-gray w-full rounded-xl border-2 bg-transparent px-4 py-2.5 text-left font-medium transition-all"
					onclick={() => {
						chooseMode(option.id);
					}}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{:else}
		<p class="text-dark-light-blue text-sm">
			{mode === 'webauthn'
				? "Confirme avec ta passkey : empreinte, visage ou code de l'appareil."
				: mode === 'recovery'
					? 'Saisis un de tes codes de récupération à usage unique.'
					: mode === 'totp'
						? "Saisis le code affiché par ton application d'authentification."
						: email
							? `Saisis le code à 6 chiffres envoyé à ${email}.`
							: 'Saisis le code à 6 chiffres reçu par email.'}
		</p>

		<form class="space-y-4 md:space-y-6" onsubmit={handleSubmit}>
			{#if mode === 'webauthn'}
				<!-- Pas de saisie : la cérémonie se joue dans le prompt du navigateur. -->
			{:else if mode === 'recovery'}
				<div>
					<label for="recovery-code" class="mb-2 block text-sm font-medium text-white">
						Code de récupération
					</label>
					<input
						type="text"
						id="recovery-code"
						required
						autocomplete="off"
						spellcheck="false"
						placeholder="XXXXX-XXXXX"
						class="border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue block w-full rounded-lg border-2 bg-transparent p-2.5 font-mono tracking-widest focus:border-blue-500 focus:ring-blue-500"
						bind:value={recoveryCode}
					/>
				</div>
			{:else}
				<div class="space-y-2">
					<span class="mb-2 block text-sm font-medium text-white">Code de vérification</span>
					<CodeInput
						id="mfa-code"
						bind:value={code}
						disabled={loading}
						cellClass={CODE_CELL_CLASS}
					/>
					{#if mode === 'email'}
						<button
							type="button"
							class="text-dark-light-blue cursor-pointer border-0 bg-transparent p-0 text-left text-sm hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
							disabled={loading || resending || resendCooldown > 0}
							onclick={handleResend}
						>
							{resending
								? 'Envoi…'
								: resendCooldown > 0
									? `Renvoyer le code (${String(resendCooldown)}s)`
									: 'Renvoyer le code'}
						</button>
					{/if}
				</div>
			{/if}

			<label class="text-dark-light-blue flex items-center gap-2 text-sm">
				<Checkbox className="size-4" bind:checked={trustDevice} />
				Ne plus demander sur cet appareil pendant 30 jours
			</label>

			{#if errorMessage}
				<p class="text-sm text-red-400">{errorMessage}</p>
			{/if}

			{#if mode === 'webauthn'}
				<button
					type="button"
					id="mfa-passkey"
					disabled={loading}
					onclick={handlePasskey}
					class="hover:bg-dark-light-blue hover:text-dark-blue text-dark-light-blue border-dark-light-blue focus:ring-dark-blue-gray w-full rounded-xl border-[3.25px] bg-transparent px-4 py-2 text-center font-bold transition-all focus:ring-4 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Vérification ...' : 'Vérifier avec ma passkey'}
				</button>
			{:else}
				<button
					type="submit"
					disabled={loading}
					class="hover:bg-dark-light-blue hover:text-dark-blue text-dark-light-blue border-dark-light-blue focus:ring-dark-blue-gray w-full rounded-xl border-[3.25px] bg-transparent px-4 py-2 text-center font-bold transition-all focus:ring-4 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Vérification ...' : 'Vérifier'}
				</button>
			{/if}
		</form>
	{/if}

	{#if showMethodToggle}
		<div class="text-dark-light-blue text-sm">
			<button
				type="button"
				class="cursor-pointer border-0 bg-transparent p-0 text-left hover:underline"
				onclick={() => (chooserOpen = !chooserOpen)}
			>
				{chooserOpen ? 'Retour à la saisie' : 'Utiliser une autre méthode'}
			</button>
		</div>
	{/if}
</div>
