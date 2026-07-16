<script lang="ts">
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import { stepUpChallenge, stepUpVerify, type StepUpMethod } from '$lib/settings/mfa';
	import { stepUpRequest, type StepUpRequest } from '$lib/settings/stepUp';
	import { onDestroy } from 'svelte';

	let request = $state<StepUpRequest | null>(null);
	let method = $state<StepUpMethod | null>(null);
	let code = $state('');
	let recoveryCode = $state('');
	let password = $state('');
	let useRecovery = $state<boolean>(false);
	let busy = $state<boolean>(false);
	let errorMessage = $state<string | null>(null);
	let resendCooldown = $state(0);

	let cooldownTimer: ReturnType<typeof setInterval> | null = null;

	const unsubscribe = stepUpRequest.subscribe((value) => {
		const opening = value !== null && request === null;
		request = value;
		if (opening) {
			void open();
		}
	});
	onDestroy(() => {
		unsubscribe();
		if (cooldownTimer) {
			clearInterval(cooldownTimer);
		}
	});

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

	async function open() {
		method = null;
		code = '';
		recoveryCode = '';
		password = '';
		useRecovery = false;
		errorMessage = null;
		busy = true;
		try {
			method = await stepUpChallenge();
			if (method === 'email') {
				startCooldown(60);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		busy = false;
	}

	async function handleResend() {
		errorMessage = null;
		busy = true;
		try {
			await stepUpChallenge();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		startCooldown(60);
		busy = false;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		errorMessage = null;
		try {
			await stepUpVerify(
				method === 'password'
					? { password }
					: useRecovery
						? { recovery_code: recoveryCode }
						: { code }
			);
			busy = false;
			request?.resolve(true);
			return;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		busy = false;
	}

	function cancel() {
		request?.resolve(false);
	}
</script>

{#if request}
	<div
		id="step-up-dialog"
		role="dialog"
		aria-modal="true"
		aria-label="Confirmation de sécurité"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
	>
		<div class="border-light-blue/20 w-full max-w-md rounded-2xl border bg-[#060a2c] p-5 sm:p-6">
			<p class="text-dark-light-blue m-0 mb-3 text-[0.65rem] tracking-[0.32em] uppercase">
				Confirmation de sécurité
			</p>

			{#if method === null}
				<p class="text-dark-light-blue m-0 text-sm">
					{errorMessage ?? 'Chargement…'}
				</p>
				<div class="mt-4 flex justify-end gap-2">
					{#if errorMessage}
						<CtaButton variant="secondary" size="sm" fullWidth={false} onclick={() => void open()}>
							Réessayer
						</CtaButton>
					{/if}
					<button
						type="button"
						class="text-dark-light-blue cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm hover:underline"
						onclick={cancel}
					>
						Annuler
					</button>
				</div>
			{:else}
				<p class="text-light-blue m-0 mb-4 text-sm">
					{method === 'password'
						? 'Confirme ton mot de passe pour continuer.'
						: useRecovery
							? 'Saisis un de tes codes de récupération à usage unique.'
							: 'Saisis le code reçu par e-mail.'}
				</p>
				<form class="grid gap-4" onsubmit={handleSubmit}>
					{#if method === 'password'}
						<input
							type="password"
							id="step-up-password"
							aria-label="Mot de passe actuel"
							autocomplete="current-password"
							placeholder="********"
							class="border-light-blue/30 bg-dark-blue/60 text-light-blue placeholder:text-dark-light-blue/50 focus:border-light-blue/70 block w-full rounded-xl border p-2.5 text-sm focus:outline-none disabled:opacity-50"
							disabled={busy}
							bind:value={password}
						/>
					{:else if useRecovery}
						<input
							type="text"
							id="step-up-recovery"
							aria-label="Code de récupération"
							autocomplete="off"
							spellcheck="false"
							placeholder="XXXXX-XXXXX"
							class="border-light-blue/30 bg-dark-blue/60 text-light-blue placeholder:text-dark-light-blue/50 focus:border-light-blue/70 block w-full rounded-xl border p-2.5 font-mono text-sm tracking-widest focus:outline-none disabled:opacity-50"
							disabled={busy}
							bind:value={recoveryCode}
						/>
					{:else}
						<input
							type="text"
							id="step-up-code"
							aria-label="Code de vérification"
							inputmode="numeric"
							pattern="[0-9]*"
							maxlength="6"
							autocomplete="one-time-code"
							placeholder="123456"
							class="border-light-blue/30 bg-dark-blue/60 text-light-blue placeholder:text-dark-light-blue/50 focus:border-light-blue/70 block w-full rounded-xl border p-2.5 text-center font-mono text-base tracking-[0.5em] focus:outline-none disabled:opacity-50"
							disabled={busy}
							bind:value={code}
						/>
					{/if}

					{#if errorMessage}
						<p class="m-0 text-sm text-red-400">{errorMessage}</p>
					{/if}

					<div class="flex items-center justify-end gap-2">
						<button
							type="button"
							class="text-dark-light-blue cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm hover:underline"
							onclick={cancel}
						>
							Annuler
						</button>
						<CtaButton
							type="submit"
							variant="secondary"
							size="sm"
							fullWidth={false}
							disabled={busy}
						>
							{busy ? 'Chargement…' : 'Confirmer'}
						</CtaButton>
					</div>
				</form>

				{#if method === 'email'}
					<div class="text-dark-light-blue mt-3 flex flex-col gap-1 text-xs">
						{#if !useRecovery}
							<button
								type="button"
								class="cursor-pointer rounded-lg border-0 bg-transparent p-0 text-left hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
								disabled={busy || resendCooldown > 0}
								onclick={() => void handleResend()}
							>
								{resendCooldown > 0
									? `Renvoyer le code (${String(resendCooldown)}s)`
									: 'Renvoyer le code'}
							</button>
						{/if}
						<button
							type="button"
							class="cursor-pointer rounded-lg border-0 bg-transparent p-0 text-left hover:underline"
							onclick={() => {
								useRecovery = !useRecovery;
								errorMessage = null;
							}}
						>
							{useRecovery
								? 'Utiliser le code reçu par e-mail'
								: 'Utiliser un code de récupération'}
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
