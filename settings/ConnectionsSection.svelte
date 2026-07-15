<script lang="ts">
	import CtaButton from '$lib/components/utils/CTAButton.svelte';
	import { formatParisDateTimeShort } from '$lib/helpers/parisTime';
	import { fetchConnections, revokeConnection } from '$lib/settings/sessions';
	import type { ConnectionInfo } from '$lib/settings/sessions';
	import { AppWindow } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let connections = $state<ConnectionInfo[]>([]);
	let loading = $state<boolean>(true);
	let loadError = $state<string | null>(null);
	let busy = $state<boolean>(false);

	async function load() {
		loading = true;
		loadError = null;
		try {
			connections = await fetchConnections();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Une erreur est survenue';
		}
		loading = false;
	}

	onMount(() => {
		void load();
	});

	async function handleRevoke(connection: ConnectionInfo) {
		const confirmed = window.confirm(
			`Révoquer l’accès de « ${connection.name} » ? L’application ne pourra plus obtenir ni rafraîchir de jetons.`
		);
		if (!confirmed) {
			return;
		}
		busy = true;
		try {
			await revokeConnection(connection.client_id);
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Une erreur est survenue');
		}
		await load();
		busy = false;
	}
</script>

<section
	id="connections-section"
	class="border-light-blue/20 bg-blue-gray/15 rounded-2xl border p-4 sm:p-5"
>
	<p class="text-dark-light-blue m-0 mb-3 text-[0.65rem] tracking-[0.32em] uppercase">
		Applications connectées
	</p>
	{#if loading}
		<p class="text-dark-light-blue m-0 text-sm">Chargement…</p>
	{:else if loadError}
		<p class="m-0 mb-3 text-sm text-red-400">{loadError}</p>
		<CtaButton variant="secondary" size="sm" fullWidth={false} onclick={() => void load()}>
			Réessayer
		</CtaButton>
	{:else if connections.length === 0}
		<p class="text-dark-light-blue/70 m-0 text-sm">
			Aucune application connectée à votre compte DaVinciBot.
		</p>
	{:else}
		<ul class="m-0 grid list-none gap-2 p-0">
			{#each connections as connection (connection.client_id)}
				<li
					id={`connection-${connection.client_id}`}
					class="border-light-blue/10 bg-dark-blue/40 flex items-center gap-3 rounded-xl border p-3"
				>
					<AppWindow class="text-dark-light-blue size-5 shrink-0" />
					<div class="min-w-0 flex-1">
						<p class="text-light-blue m-0 flex flex-wrap items-center gap-2 text-sm font-medium">
							{connection.name}
							<span
								class="rounded-full border px-2 py-0.5 text-[0.6rem] tracking-wider uppercase {connection.active
									? 'border-light-blue/30 text-dark-light-blue'
									: 'border-red-400/40 text-red-400'}"
							>
								{connection.active ? 'Active' : 'Expirée'}
							</span>
						</p>
						<p class="text-dark-light-blue/80 m-0 text-xs">
							{#if connection.scopes}
								Accès : {connection.scopes}
								{#if connection.latest_expires_at}
									·
								{/if}
							{/if}
							{#if connection.latest_expires_at}
								Jetons jusqu’au {formatParisDateTimeShort(connection.latest_expires_at)}
							{/if}
						</p>
					</div>
					<button
						id={`connection-revoke-${connection.client_id}`}
						type="button"
						class="shrink-0 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={busy}
						onclick={() => void handleRevoke(connection)}
					>
						Révoquer
					</button>
				</li>
			{/each}
		</ul>
		<p class="text-dark-light-blue/70 m-0 mt-2 text-xs">
			La révocation empêche l’application d’obtenir ou de rafraîchir des jetons. Une session déjà
			ouverte dans l’application peut rester active jusqu’à sa propre expiration.
		</p>
	{/if}
</section>
