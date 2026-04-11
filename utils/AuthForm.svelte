<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	import SucessModal from '../modals/InfoModal.svelte';

	/** Session-storage key used to pin the PKCE state value for CSRF protection. */
	const PKCE_STATE_KEY = 'pkce_state';

	const AuthType = {
		login: 'Login',
		register: 'Inscription',
		reset: 'Changement du mot de passe',
		oauth: 'Login avec OAuth'
	};

	export let redirect_uri = '/';
	/**
	 * {'login' | 'register' | 'reset'}
	 */
	export let auth_type = AuthType.login;
	export let access_token = '';
	export let refresh_token = '';

	if (
		auth_type !== AuthType.login &&
		auth_type !== AuthType.register &&
		auth_type !== AuthType.reset
	) {
		// try to parse it
		auth_type = AuthType[auth_type.toLowerCase()] || AuthType.login;
	}

	// Auto-detect PKCE / OpenID mode from URL parameters so the page works
	// even when auth_type is not explicitly set to "oauth".
	if (typeof window !== 'undefined' && isOpenID()) {
		auth_type = AuthType.oauth;
	}

	let loading = false;
	let email = '';
	let password = '';
	let password_confirm = '';

	onMount(async () => {
		redirect_uri = parseRedirectURI(redirect_uri);

		// Pin the incoming PKCE state to sessionStorage so we can verify it
		// has not been swapped before completing the authorization.
		if (auth_type === AuthType.oauth) {
			const params = getOpenIDParams();
			if (params.state) {
				sessionStorage.setItem(PKCE_STATE_KEY, params.state);
			}
		}

		const sessionResponse = await fetch('/auth/session');
		const sessionPayload = sessionResponse.ok
			? await sessionResponse.json()
			: { session: null, user: null };
		const session = sessionPayload.session;
		const sessionUser = sessionPayload.user;

		if (session && auth_type === AuthType.login) {
			// If the user is already logged in, redirect to the specified redirect_uri
			goto(redirect_uri);
		}
		if (session && auth_type === AuthType.oauth) {
			await handleOAuth();
		}

		email = sessionUser?.email || '';
		if (!email && access_token) {
			email = decodeEmail(access_token);
		}
	});

	const handleLogin = async () => {
		try {
			loading = true;
			const response = await fetch('/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || 'Connexion impossible.');
			}
			// If OpenID / PKCE SSO parameters are present, complete the authorization
			if (auth_type === AuthType.oauth) {
				await handleOAuth();
			} else {
				// Otherwise, just redirect to the specified redirect_uri
				goto(redirect_uri);
			}
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			}
		} finally {
			loading = false;
		}
	};

	const handleReset = async () => {
		try {
			loading = true;
			if (password !== password_confirm) {
				alert('Les mots de passe ne correspondent pas.');
				return;
			}
			const response = await fetch('/auth/password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					password,
					access_token: access_token || undefined,
					refresh_token: refresh_token || undefined
				})
			});
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || 'Impossible de mettre a jour le mot de passe.');
			}
			goto(redirect_uri);
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			}
		} finally {
			loading = false;
		}
	};

	/**
	 * Complete the PKCE Authorization Code flow acting as the authorization
	 * server.  After a successful login we call the `oidc-authorize` edge
	 * function which:
	 *   1. Verifies the client_id and redirect_uri.
	 *   2. Creates a short-lived authorization code and stores the
	 *      code_challenge alongside it.
	 *   3. Returns the redirect URL: <redirect_uri>?code=…&state=…
	 *
	 * The client then exchanges (code + code_verifier) → tokens, which
	 * the edge function verifies via SHA-256(code_verifier) === code_challenge.
	 */
	async function handleOAuth() {
		const openIdParams = getOpenIDParams();

		// CSRF check – ensure the state has not been replaced since page load.
		const pinnedState = sessionStorage.getItem(PKCE_STATE_KEY);
		if (pinnedState && pinnedState !== openIdParams.state) {
			console.error('PKCE state mismatch – possible CSRF attempt.');
			alert('Une erreur de sécurité est survenue (state invalide). Veuillez recommencer.');
			return;
		}

		const response = await fetch('/auth/oidc/authorize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: openIdParams.client_id,
				redirect_uri: openIdParams.redirect_uri,
				response_type: openIdParams.response_type,
				state: openIdParams.state,
				scope: openIdParams.scope,
				nonce: openIdParams.nonce,
				code_challenge: openIdParams.code_challenge,
				code_challenge_method: openIdParams.code_challenge_method
			})
		});
		if (!response.ok) {
			const payload = await response.json().catch(() => ({}));
			console.error('Error invoking OIDC authorize function:', payload);
			alert('Une erreur est survenue lors de la connexion avec OAuth.');
			return;
		}
		const data = await response.json();
		if (data?.redirect_uri) {
			// Clean up stored state before leaving.
			sessionStorage.removeItem(PKCE_STATE_KEY);
			window.location.href = data.redirect_uri;
		}
	}

	const handleRegister = async () => {
		try {
			loading = true;

			const response = await fetch('/auth/password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					password,
					access_token: access_token || undefined,
					refresh_token: refresh_token || undefined
				})
			});
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || "Impossible d'enregistrer le mot de passe.");
			}
			if (response.ok) {
				// show success message
				new SucessModal({
					target: document.body,
					props: {
						message:
							'Vous avez bien été inscrit. Vous allez être redirigé vers la page de connexion.',
						onClose: () => {
							goto(`${base}/login`);
						}
					}
				});
			}
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			}
		} finally {
			loading = false;
		}
	};

	const handleAuth = async () => {
		if (auth_type === AuthType.login || auth_type === AuthType.oauth) {
			await handleLogin();
		} else if (auth_type === AuthType.reset) {
			await handleReset();
		} else if (auth_type === AuthType.register) {
			await handleRegister();
		}
	};

	function parseRedirectURI(redirect_uri) {
		const urlParams = new URLSearchParams(window.location.search);
		const redirect = urlParams.get('redirect');
		if (redirect) {
			return redirect;
		} else if (redirect_uri == '/') {
			return window.location.origin;
		} else {
			return redirect_uri;
		}
	}

	/** Returns true when all mandatory PKCE Authorization Code params are present. */
	function isOpenID() {
		const urlParams = new URLSearchParams(window.location.search);
		return (
			urlParams.has('client_id') &&
			urlParams.has('redirect_uri') &&
			urlParams.has('response_type') &&
			urlParams.has('state') &&
			urlParams.has('scope') &&
			urlParams.has('code_challenge') &&
			urlParams.has('code_challenge_method')
		);
	}

	/**
	 * Extracts all PKCE / OIDC parameters from the current URL.
	 * `nonce` is optional per the spec but forwarded when present so the
	 * edge function can embed it in the issued ID token.
	 */
	function getOpenIDParams() {
		const urlParams = new URLSearchParams(window.location.search);
		const openIdParams = {};

		const ssoParams = [
			'client_id',
			'redirect_uri',
			'response_type',
			'state',
			'scope',
			'nonce',
			'code_challenge',
			'code_challenge_method'
		];

		ssoParams.forEach((param) => {
			const value = urlParams.get(param);
			if (value) {
				openIdParams[param] = value;
			}
		});

		return openIdParams;
	}

	function decodeEmail(token) {
		try {
			const payload = token.split('.')[1];
			if (!payload) return '';
			const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
			const decoded = atob(base64);
			const data = JSON.parse(decoded);
			return data?.email || '';
		} catch {
			return '';
		}
	}
</script>

<section class="">
	<div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
		<a class="flex items-center mb-6 text-2xl font-semibold text-white" href="/">
			<img class="h-20 mr-2" src="/white_logo.webp" alt="logo" />
		</a>
		<div
			class="w-full rounded-xl border-[3.5px] shadow border-dark-blue-gray md:mt-0 sm:max-w-md xl:p-0"
		>
			<div class="p-6 space-y-4 md:space-y-6 sm:p-8">
				<h1 class="text-xl font-bold leading-tight tracking-tight text-white md:text-2xl">
					{auth_type}
				</h1>
				<form class="space-y-4 md:space-y-6" on:submit|preventDefault={handleAuth}>
					<div>
						<label for="email" class="block mb-2 text-sm font-medium text-white">Votre email</label>
						<input
							type="email"
							name="email"
							id="email"
							class="border-2 rounded-lg block w-full p-2.5 bg-transparent border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue focus:ring-blue-500 focus:border-blue-500"
							placeholder="davincibot@devinci.fr"
							disabled={auth_type === AuthType.reset || auth_type === AuthType.register}
							bind:value={email}
						/>
					</div>
					<div>
						<label for="password" class="block mb-2 text-sm font-medium text-white"
							>Votre mot de passe</label
						>
						<input
							type="password"
							name="password"
							id="password"
							placeholder="••••••••"
							class="border-2 rounded-lg block w-full p-2.5 bg-transparent border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue focus:ring-blue-500 focus:border-blue-500"
							bind:value={password}
						/>
					</div>
					{#if auth_type === AuthType.reset || auth_type === AuthType.register}
						<div>
							<label for="password-confirm" class="block mb-2 text-sm font-medium text-white"
								>Confirmer votre mot de passe</label
							>
							<input
								type="password"
								name="password-confirm"
								id="password-confirm"
								placeholder="••••••••"
								class="border-2 rounded-lg block w-full p-2.5 bg-transparent border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue focus:ring-blue-500 focus:border-blue-500"
								bind:value={password_confirm}
							/>
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="px-4 py-2 font-bold rounded-xl hover:bg-dark-light-blue hover:text-dark-blue text-dark-light-blue border-[3.25px] transition-all border-dark-light-blue w-full focus:outline-none text-center bg-transparent focus:ring-dark-blue-gray focus:ring-4 disabled:opacity-50"
						>{loading ? 'Chargement ...' : auth_type}</button
					>
				</form>
			</div>
			{#if auth_type === AuthType.login}
				<div
					class="flex items-center justify-center px-4 py-2 text-sm text-gray-400 border-t rounded-b-lg border-dark-blue-gray"
				>
					<a href="/auth/reset" class="hover:underline">Mot de passe oublié ?</a>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
</style>
