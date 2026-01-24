<script lang="ts">
	import { userdata } from '$lib/store';
	import { supabase } from '$lib/supabaseClient';
	import { loadUserdata } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';

	const STORAGE_KEY = 'dev_auth_accounts';

	interface Account {
		email: string;
		password: string;
	}

	let open = $state(false);
	let accounts: Account[] = $state([]);
	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state('');
	let currentEmail = $state('');

	function loadAccounts() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			accounts = raw ? JSON.parse(raw) : [];
		} catch (err) {
			accounts = [];
		}
	}

	function saveAccounts(nextAccounts: Account[]) {
		accounts = nextAccounts;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAccounts));
		} catch (err) {
			// ignore
		}
	}

	async function refreshSession() {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		currentEmail = session?.user?.email || '';
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

	async function loginWith(account: Account) {
		error = '';
		busy = true;
		try {
			await supabase.auth.signOut();
			const { error: signInError } = await supabase.auth.signInWithPassword({
				email: account.email,
				password: account.password
			});
			if (signInError) throw signInError;
			await loadUserdata();
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
			await supabase.auth.signOut();
			await loadUserdata();
			await refreshSession();
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			}
		} finally {
			busy = false;
		}
	}

	function removeAccount(target: Account) {
		saveAccounts(accounts.filter((item) => item.email !== target.email));
	}

	const unsubscribe = userdata.subscribe((value: any) => {
		if (value?.email) {
			currentEmail = value.email;
		}
	});

	onMount(() => {
		loadAccounts();
		refreshSession();
		const { data } = supabase.auth.onAuthStateChange(() => {
			refreshSession();
		});
		return () => data.subscription.unsubscribe();
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="fixed right-6 bottom-6 z-50">
	<button
		class="rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-xs font-semibold tracking-wide text-gray-200 uppercase shadow-lg backdrop-blur"
		onclick={() => (open = !open)}
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
					onclick={logout}
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
					onclick={addAccount}
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
					{#each accounts as account}
						<div
							class="flex items-center justify-between rounded-lg border border-gray-700 px-3 py-2"
						>
							<span class="truncate text-sm text-gray-100">{account.email}</span>
							<div class="flex gap-2">
								<button
									class="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
									disabled={busy}
									onclick={() => loginWith(account)}
									type="button"
								>
									Connexion
								</button>
								<button
									class="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
									onclick={() => removeAccount(account)}
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
