<script lang="ts">
	import PasskeyNameModal from '$lib/components/modals/PasskeyNameModal.svelte';
	import RecoveryCodesModal from '$lib/components/modals/RecoveryCodesModal.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import { formatParisDateTimeShort } from '$lib/helpers/parisTime';
	import {
		deletePasskey,
		fetchPasskeys,
		registerPasskey,
		renamePasskey,
		type PasskeyInfo
	} from '$lib/settings/passkeys';
	import { alertUnlessCancelled, withStepUp } from '$lib/settings/stepUp';
	import { FingerprintPattern, Pencil, Trash2 } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let passkeys = $state<PasskeyInfo[]>([]);
	let loading = $state<boolean>(true);
	let loadError = $state<string | null>(null);
	let busy = $state<boolean>(false);
	let supported = $state<boolean>(false);
	let nameModalOpen = $state<boolean>(false);
	let renameTarget = $state<PasskeyInfo | null>(null);
	let recoveryCodes = $state<string[] | null>(null);

	async function load() {
		loading = true;
		loadError = null;
		try {
			passkeys = await fetchPasskeys();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		loading = false;
	}

	onMount(() => {
		supported = typeof window.PublicKeyCredential !== 'undefined';
		void load();
	});

	function openAdd() {
		renameTarget = null;
		nameModalOpen = true;
	}

	function openRename(passkey: PasskeyInfo) {
		renameTarget = passkey;
		nameModalOpen = true;
	}

	async function handleNameSubmit(name: string) {
		const target = renameTarget;
		nameModalOpen = false;
		renameTarget = null;
		busy = true;
		try {
			if (target) {
				await withStepUp(() => renamePasskey(target.id, name));
			} else {
				const result = await withStepUp(() => registerPasskey(name));
				if (result.recovery_codes) {
					recoveryCodes = result.recovery_codes;
				}
			}
			await load();
		} catch (error) {
			// Prompt WebAuthn refusé/fermé par l'utilisateur : abandon silencieux.
			if (!(error instanceof Error && error.name === 'NotAllowedError')) {
				alertUnlessCancelled(error);
			}
		}
		busy = false;
	}

	async function handleDelete(passkey: PasskeyInfo) {
		if (!window.confirm(`Supprimer la passkey « ${passkey.friendly_name} » ?`)) {
			return;
		}
		busy = true;
		try {
			await withStepUp(() => deletePasskey(passkey.id));
		} catch (error) {
			alertUnlessCancelled(error);
		}
		await load();
		busy = false;
	}
</script>

<section
	id="passkeys-section"
	class="border-light-blue/20 bg-blue-gray/15 rounded-2xl border p-4 sm:p-5"
>
	<p class="text-dark-light-blue m-0 mb-3 text-[0.65rem] tracking-[0.32em] uppercase">Passkeys</p>
	<p class="text-dark-light-blue m-0 mb-3 text-sm">
		Connecte-toi sans mot de passe et confirme les actions sensibles avec ton empreinte, ton visage
		ou le code de ton appareil.
	</p>
	{#if loading}
		<p class="text-dark-light-blue m-0 text-sm">Chargement…</p>
	{:else if loadError}
		<p class="m-0 mb-3 text-sm text-red-400">{loadError}</p>
		<CtaButton variant="secondary" size="sm" fullWidth={false} onclick={() => void load()}>
			Réessayer
		</CtaButton>
	{:else}
		{#if passkeys.length === 0}
			<p class="text-dark-light-blue m-0 mb-3 text-sm">Aucune passkey enregistrée.</p>
		{:else}
			<ul class="m-0 mb-3 grid list-none gap-2 p-0">
				{#each passkeys as passkey (passkey.id)}
					<li
						id={`passkey-row-${passkey.id}`}
						class="border-light-blue/10 bg-dark-blue/40 flex items-center gap-3 rounded-xl border p-3"
					>
						<FingerprintPattern class="text-dark-light-blue size-5 shrink-0" />
						<div class="min-w-0 flex-1">
							<p class="text-light-blue m-0 flex flex-wrap items-center gap-2 text-sm font-medium">
								<span class="truncate">{passkey.friendly_name}</span>
								{#if passkey.backed_up}
									<span
										title="Synchronisée entre tes appareils (iCloud, Google…)"
										class="border-light-blue/30 text-dark-light-blue shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem]"
									>
										Synchronisée
									</span>
								{/if}
							</p>
							<p class="text-dark-light-blue/80 m-0 truncate text-xs">
								{passkey.last_used_at
									? `Utilisée le ${formatParisDateTimeShort(passkey.last_used_at)}`
									: `Ajoutée le ${formatParisDateTimeShort(passkey.created_at)}`}
							</p>
						</div>
						<button
							id={`passkey-rename-${passkey.id}`}
							type="button"
							aria-label="Renommer cette passkey"
							title="Renommer cette passkey"
							class="text-dark-light-blue hover:bg-light-blue/10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-2 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={busy}
							onclick={() => {
								openRename(passkey);
							}}
						>
							<Pencil class="size-4" />
						</button>
						<button
							id={`passkey-delete-${passkey.id}`}
							type="button"
							aria-label="Supprimer cette passkey"
							title="Supprimer cette passkey"
							class="shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-2 text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={busy}
							onclick={() => void handleDelete(passkey)}
						>
							<Trash2 class="size-4" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		{#if supported}
			<CtaButton
				id="passkey-add"
				variant="secondary"
				size="sm"
				fullWidth={false}
				disabled={busy}
				onclick={openAdd}
			>
				Ajouter une passkey
			</CtaButton>
		{:else}
			<p class="text-dark-light-blue m-0 text-xs">
				Ce navigateur ne prend pas en charge les passkeys.
			</p>
		{/if}
	{/if}
</section>

{#if nameModalOpen}
	<PasskeyNameModal
		title={renameTarget ? 'Renommer la passkey' : 'Ajouter une passkey'}
		description={renameTarget
			? null
			: 'Donne-lui un nom pour la retrouver, puis suis les instructions de ton navigateur.'}
		initialName={renameTarget?.friendly_name ?? ''}
		confirmLabel={renameTarget ? 'Renommer' : 'Continuer'}
		onSubmit={(name) => {
			void handleNameSubmit(name);
		}}
		onCancel={() => {
			nameModalOpen = false;
			renameTarget = null;
		}}
	/>
{/if}

{#if recoveryCodes}
	<RecoveryCodesModal codes={recoveryCodes} onClose={() => (recoveryCodes = null)} />
{/if}
