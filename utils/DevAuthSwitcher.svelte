<script>
	import { userdata } from '$lib/store';
	import { onDestroy, onMount } from 'svelte';

	const STORAGE_KEY = 'dev_auth_accounts';

	export let positionClass = 'right-6 bottom-6';

	let open = false;
	let accounts = [];
	let email = '';
	let password = '';
	let busy = false;
	let error = '';
	let currentEmail = '';

	function loadAccounts() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			const parsed = raw ? JSON.parse(raw) : [];
			accounts = Array.isArray(parsed) ? parsed : [];
		} catch {
			accounts = [];
		}
	}

	function saveAccounts(nextAccounts) {
		accounts = nextAccounts;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAccounts));
		} catch {
			// ignore
		}
	}

	async function refreshSession() {
		const res = await fetch('/auth/session');
		if (!res.ok) {
			currentEmail = '';
			return;
		}
		const payload = await res.json();
		currentEmail = payload?.user?.email || '';
	}

	async function addAccount() {
		error = '';
		if (!email || !password) {
			error = 'Email and password are required.';
			return;
		}
		const normalized = email.trim().toLowerCase();
		const filtered = accounts.filter((item) => item.email.toLowerCase() !== normalized);
		saveAccounts([...filtered, { email: normalized, password }]);
		email = '';
		password = '';
	}

	async function loginWith(account) {
		error = '';
		busy = true;
		try {
			await fetch('/auth/logout', { method: 'POST' });
			const response = await fetch('/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: account.email, password: account.password })
			});
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || 'Unable to sign in.');
			}
			await refreshSession();
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Unable to sign in.';
			}
		} finally {
			busy = false;
		}
	}

	async function logout() {
		error = '';
		busy = true;
		try {
			await fetch('/auth/logout', { method: 'POST' });
			await refreshSession();
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			}
		} finally {
			busy = false;
		}
	}

	function removeAccount(target) {
		saveAccounts(accounts.filter((item) => item.email !== target.email));
	}

	const unsubscribe = userdata.subscribe((value) => {
		if (value?.email) {
			currentEmail = value.email;
		}
	});

	onMount(() => {
		loadAccounts();
		refreshSession();
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class={`fixed ${positionClass} z-9999 pointer-events-auto`}>
	<button
		class="rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-xs font-semibold tracking-wide text-gray-200 uppercase shadow-lg backdrop-blur"
		on:click={() => (open = !open)}
		type="button"
	>
		Dev Auth
	</button>
	{#if open}
		<div
			class="mt-3 w-80 rounded-2xl border border-gray-700 bg-gray-900/90 p-4 text-sm text-gray-100 shadow-xl backdrop-blur"
		>
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs tracking-wide text-gray-400 uppercase">Session</p>
					<p class="text-sm font-semibold text-white">
						{currentEmail || 'No session'}
					</p>
				</div>
				<button
					class="rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
					disabled={busy}
					on:click={logout}
					type="button"
				>
					Deconnexion
				</button>
			</div>

			<div class="mt-4 space-y-2">
				<p class="text-xs tracking-wide text-gray-400 uppercase">Ajouter un compte</p>
				<input
					class="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
					placeholder="email"
					bind:value={email}
					type="email"
				/>
				<input
					class="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
					placeholder="password"
					bind:value={password}
					type="password"
				/>
				<button
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-700"
					on:click={addAccount}
					type="button"
				>
					Ajouter
				</button>
			</div>

			{#if error}
				<p
					class="mt-3 rounded-lg border border-red-400/30 bg-red-900/30 px-3 py-2 text-xs text-red-200"
				>
					{error}
				</p>
			{/if}

			<div class="mt-4 space-y-2">
				<p class="text-xs tracking-wide text-gray-400 uppercase">Comptes</p>
				{#if accounts.length === 0}
					<p class="text-xs text-gray-500">No saved accounts.</p>
				{:else}
					{#each accounts as account (account.email)}
						<div
							class="flex items-center justify-between rounded-lg border border-gray-700 px-3 py-2"
						>
							<span class="truncate text-sm text-gray-100">{account.email}</span>
							<div class="flex gap-2">
								<button
									class="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
									disabled={busy}
									on:click={() => loginWith(account)}
									type="button"
								>
									Connexion
								</button>
								<button
									class="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
									on:click={() => removeAccount(account)}
									type="button"
								>
									Supprimer
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
