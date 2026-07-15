<script lang="ts">
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import { formatParisDateTimeShort } from '$lib/helpers/parisTime';
	import { isMobileUserAgent, parseDeviceLabel } from '$lib/settings/deviceLabel';
	import { fetchSessions, revokeAllSessions, revokeSession } from '$lib/settings/sessions';
	import type { SessionInfo } from '$lib/settings/sessions';
	import { Monitor, ShieldCheck, Smartphone } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let sessions = $state<SessionInfo[]>([]);
	let loading = $state<boolean>(true);
	let loadError = $state<string | null>(null);
	let busy = $state<boolean>(false);

	const otherSessions = $derived(sessions.filter((session) => !session.is_current));

	async function load() {
		loading = true;
		loadError = null;
		try {
			sessions = await fetchSessions();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		loading = false;
	}

	onMount(() => {
		void load();
	});

	async function handleRevoke(session: SessionInfo) {
		const label = parseDeviceLabel(session.device_label);
		if (!window.confirm(`Déconnecter « ${label} » ?`)) {
			return;
		}
		busy = true;
		try {
			await revokeSession(session.id);
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
		}
		// recharge dans tous les cas : un 404 signifie une liste périmée
		await load();
		busy = false;
	}

	async function handleRevokeAll() {
		if (!window.confirm('Déconnecter tous les autres appareils ?')) {
			return;
		}
		busy = true;
		try {
			await revokeAllSessions();
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
		}
		await load();
		busy = false;
	}
</script>

<section
	id="sessions-section"
	class="border-light-blue/20 bg-blue-gray/15 rounded-2xl border p-4 sm:p-5"
>
	<p class="text-dark-light-blue m-0 mb-3 text-[0.65rem] tracking-[0.32em] uppercase">
		Appareils connectés
	</p>
	{#if loading}
		<p class="text-dark-light-blue m-0 text-sm">Chargement…</p>
	{:else if loadError}
		<p class="m-0 mb-3 text-sm text-red-400">{loadError}</p>
		<CtaButton variant="secondary" size="sm" fullWidth={false} onclick={() => void load()}>
			Réessayer
		</CtaButton>
	{:else}
		<ul class="m-0 grid list-none gap-2 p-0">
			{#each sessions as session (session.id)}
				{@const DeviceIcon = isMobileUserAgent(session.device_label) ? Smartphone : Monitor}
				<li
					id={`session-${session.id}`}
					class="border-light-blue/10 bg-dark-blue/40 flex items-center gap-3 rounded-xl border p-3"
				>
					<DeviceIcon class="text-dark-light-blue size-5 shrink-0" />
					<div class="min-w-0 flex-1">
						<p class="text-light-blue m-0 flex flex-wrap items-center gap-2 text-sm font-medium">
							{parseDeviceLabel(session.device_label)}
							{#if session.is_current}
								<span
									class="border-light-blue/30 text-dark-light-blue rounded-full border px-2 py-0.5 text-[0.6rem] tracking-wider uppercase"
								>
									Cet appareil
								</span>
							{/if}
							{#if session.trusted_device}
								<span
									class="border-light-blue/30 text-dark-light-blue inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] tracking-wider uppercase"
								>
									<ShieldCheck class="size-3" />
									Confiance
								</span>
							{/if}
						</p>
						<p class="text-dark-light-blue/80 m-0 text-xs">
							Dernière activité : {formatParisDateTimeShort(
								session.last_seen_at ?? session.created_at
							)}
						</p>
					</div>
					{#if !session.is_current}
						<button
							id={`session-revoke-${session.id}`}
							type="button"
							class="shrink-0 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={busy}
							onclick={() => void handleRevoke(session)}
						>
							Déconnecter
						</button>
					{/if}
				</li>
			{/each}
		</ul>
		{#if otherSessions.length > 0}
			<button
				id="sessions-revoke-all"
				type="button"
				class="mt-3 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={busy}
				onclick={() => void handleRevokeAll()}
			>
				Déconnecter tous les autres appareils
			</button>
		{:else}
			<p class="text-dark-light-blue/70 m-0 mt-3 text-xs">Aucun autre appareil connecté.</p>
		{/if}
		<p class="text-dark-light-blue/70 m-0 mt-2 text-xs">
			La déconnexion est immédiate ici et effective sous quelques minutes sur les autres
			applications DaVinciBot.
		</p>
	{/if}
</section>
