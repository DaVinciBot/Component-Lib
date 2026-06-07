<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { mountClosable } from '$lib/utils';
	import { onMount } from 'svelte';

	import SucessModal from '$lib/components/modals/InfoModal.svelte';

	/** Session-storage key used to pin the PKCE state value for CSRF protection. */
	const PKCE_STATE_KEY = 'pkce_state';

	const AuthType = {
		login: 'Login',
		register: 'Inscription',
		reset: 'Changement du mot de passe',
		oauth: 'Login avec OAuth'
	} as const;

	type AuthTypeValue = (typeof AuthType)[keyof typeof AuthType];

	interface AuthFormProps {
		redirect_uri?: string;
		auth_type?: string;
		access_token?: string;
		refresh_token?: string;
	}

	interface SessionPayload {
		session: unknown;
		user: { email?: string | null } | null;
	}

	interface OpenIDParams {
		client_id?: string;
		redirect_uri?: string;
		response_type?: string;
		state?: string;
		scope?: string;
		nonce?: string;
		code_challenge?: string;
		code_challenge_method?: string;
	}

	const authTypeByKey: Record<string, AuthTypeValue> = {
		login: AuthType.login,
		register: AuthType.register,
		reset: AuthType.reset,
		oauth: AuthType.oauth
	};

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	function isSessionPayload(value: unknown): value is SessionPayload {
		return isRecord(value) && 'session' in value && 'user' in value;
	}

	function normalizeAuthType(value: string): AuthTypeValue {
		if (Object.values(AuthType).includes(value as AuthTypeValue)) {
			return value as AuthTypeValue;
		}

		return authTypeByKey[value.toLowerCase()] ?? AuthType.login;
	}

	/* eslint-disable prefer-const */
	let {
		redirect_uri = $bindable('/'),
		auth_type = $bindable(AuthType.login),
		access_token = '',
		refresh_token = ''
	}: AuthFormProps = $props();
	/* eslint-enable prefer-const */

	auth_type = normalizeAuthType(auth_type);

	// Auto-detect PKCE / OpenID mode from URL parameters so the page works
	// even when auth_type is not explicitly set to "oauth".
	if (typeof window !== 'undefined' && isOpenID()) {
		auth_type = AuthType.oauth;
	}

	let loading = $state<boolean>(false);
	let email = $state('');
	let password = $state('');
	let password_confirm = $state('');

	async function navigateTo(target: string) {
		if (target.startsWith('http')) {
			window.location.href = target;
			return;
		}

		await goto(resolve(target as '/'));
	}

	async function readJson(response: Response): Promise<unknown> {
		try {
			return await response.json();
		} catch {
			return null;
		}
	}

	async function readErrorMessage(response: Response, fallback: string): Promise<string> {
		const payload = await readJson(response);
		return isRecord(payload) && typeof payload.error === 'string' ? payload.error : fallback;
	}

	function optionalToken(token: string): string | undefined {
		return token.length > 0 ? token : undefined;
	}

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
		const rawSessionPayload = sessionResponse.ok ? await readJson(sessionResponse) : null;
		const sessionPayload = isSessionPayload(rawSessionPayload)
			? rawSessionPayload
			: { session: null, user: null };
		const session = sessionPayload.session;
		const sessionUser = sessionPayload.user;

		if (session && auth_type === AuthType.login) {
			// If the user is already logged in, redirect to the specified redirect_uri
			void navigateTo(redirect_uri);
		}
		if (session && auth_type === AuthType.oauth) {
			await handleOAuth();
		}

		email = sessionUser?.email ?? '';
		if (!email && access_token) {
			email = decodeEmail(access_token);
		}
	});

	// TODO: This function shares a lot of code with the handler in the edge function.
	// We should unify them to avoid drift and ensure consistent behavior (e.g. around error handling).

	// TODO: We should also unify the handlers for login / register / reset since they share a lot of common code (form handling, error handling, etc.) and only differ in the API endpoint and payload.

	// TODO: We should also handle and display errors more gracefully in the UI instead of just using alert().

	// TODO: We should also add client-side validation for the form inputs (e.g. email format, password strength, etc.) before sending the request to the server.

	// TODO: We should also consider adding support for showing server-side validation errors (e.g. "email already in use" for registration) in the UI instead of just using alert().

	// TODO: mieux gérer les différents types d'erreurs (network errors, server errors, validation errors, etc.) pour afficher des messages plus précis à l'utilisateur.

	// FIXME: handle the case where the access token is expired and we need to use the refresh token to get a new one before completing the OAuth flow.

	// FIXME: handle the case where the user tries to access the login page while already having a valid session (e.g. show a message "you are already logged in" and a button to go to the app or log out instead of just redirecting them).

	// FIXME: handle the case where the user tries to access the registration page while already having a valid session (e.g. show a message "you are already logged in" and a button to go to the app or log out instead of just showing the registration form).

	// FIXME: handle the case where the user tries to access the password reset page while already having a valid session (e.g. show a message "you are already logged in" and a button to go to the app or log out instead of just showing the password reset form).

	// FIXME: handle the case where the user tries to access the OAuth login page while already having a valid session (e.g. show a message "you are already logged in" and a button to go to the app or log out instead of just redirecting them).

	// TODO: Vérifier le flux de sécurité des tokens etc.

	const handleLogin = async () => {
		try {
			loading = true;
			const response = await fetch('/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'Connexion impossible.'));
			}
			// If OpenID / PKCE SSO parameters are present, complete the authorization
			if (auth_type === AuthType.oauth) {
				await handleOAuth();
			} else {
				// Otherwise, just redirect to the specified redirect_uri
				await navigateTo(redirect_uri);
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
					access_token: optionalToken(access_token),
					refresh_token: optionalToken(refresh_token)
				})
			});
			if (!response.ok) {
				throw new Error(
					await readErrorMessage(response, 'Impossible de mettre a jour le mot de passe.')
				);
			}
			await navigateTo(redirect_uri);
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
			alert('Une erreur est survenue lors de la connexion avec OAuth.');
			return;
		}
		const data = await readJson(response);
		const redirectUri =
			isRecord(data) && typeof data.redirect_uri === 'string' ? data.redirect_uri : null;
		if (redirectUri) {
			// Clean up stored state before leaving.
			sessionStorage.removeItem(PKCE_STATE_KEY);
			window.location.href = redirectUri;
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
					access_token: optionalToken(access_token),
					refresh_token: optionalToken(refresh_token)
				})
			});
			if (!response.ok) {
				throw new Error(
					await readErrorMessage(response, "Impossible d'enregistrer le mot de passe.")
				);
			}
			// show success message
			mountClosable(SucessModal, {
				target: document.body,
				props: {
					message:
						'Vous avez bien été inscrit. Vous allez être redirigé vers la page de connexion.',
					onClose: () => {
						void navigateTo('/auth/login');
					}
				}
			});
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

	function parseRedirectURI(redirect_uri: string): string {
		const urlParams = new URLSearchParams(window.location.search);
		const redirect = urlParams.get('redirect');
		if (redirect) {
			return redirect;
		} else if (redirect_uri === '/') {
			return window.location.origin;
		}
		return redirect_uri;
	}

	/** Returns true when all mandatory PKCE Authorization Code params are present. */
	function isOpenID(): boolean {
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
	function getOpenIDParams(): OpenIDParams {
		const urlParams = new URLSearchParams(window.location.search);
		const openIdParams: OpenIDParams = {};

		const ssoParams: (keyof OpenIDParams)[] = [
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

	function decodeEmail(token: string): string {
		try {
			const payload = token.split('.')[1];
			if (!payload) {
				return '';
			}
			const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
			const decoded = atob(base64);
			const data: unknown = JSON.parse(decoded);
			return isRecord(data) && typeof data.email === 'string' ? data.email : '';
		} catch {
			return '';
		}
	}
</script>

<section class="">
	<div class="mx-auto flex flex-col items-center justify-center px-6 py-8 md:h-screen lg:py-0">
		<a class="mb-6 flex items-center text-2xl font-semibold text-white" href={resolve('/')}>
			<img class="mr-2 h-20" src="/white_logo.webp" alt="logo" />
		</a>
		<div
			class="border-dark-blue-gray w-full rounded-xl border-[3.5px] shadow sm:max-w-md md:mt-0 xl:p-0"
		>
			<div class="space-y-4 p-6 sm:p-8 md:space-y-6">
				<h1 class="text-xl leading-tight font-bold tracking-tight text-white md:text-2xl">
					{auth_type}
				</h1>
				<form
					class="space-y-4 md:space-y-6"
					onsubmit={(event: SubmitEvent) => {
						event.preventDefault();
						void handleAuth();
					}}
				>
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-white">Votre email</label>
						<input
							type="email"
							name="email"
							id="email"
							class="border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue block w-full rounded-lg border-2 bg-transparent p-2.5 focus:border-blue-500 focus:ring-blue-500"
							placeholder="davincibot@devinci.fr"
							disabled={auth_type === AuthType.reset || auth_type === AuthType.register}
							bind:value={email}
						/>
					</div>
					<div>
						<label for="password" class="mb-2 block text-sm font-medium text-white"
							>Votre mot de passe</label
						>
						<input
							type="password"
							name="password"
							id="password"
							placeholder="••••••••"
							class="border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue block w-full rounded-lg border-2 bg-transparent p-2.5 focus:border-blue-500 focus:ring-blue-500"
							bind:value={password}
						/>
					</div>
					{#if auth_type === AuthType.reset || auth_type === AuthType.register}
						<div>
							<label for="password-confirm" class="mb-2 block text-sm font-medium text-white"
								>Confirmer votre mot de passe</label
							>
							<input
								type="password"
								name="password-confirm"
								id="password-confirm"
								placeholder="••••••••"
								class="border-dark-blue-gray placeholder-dark-light-blue-faded text-dark-light-blue block w-full rounded-lg border-2 bg-transparent p-2.5 focus:border-blue-500 focus:ring-blue-500"
								bind:value={password_confirm}
							/>
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="hover:bg-dark-light-blue hover:text-dark-blue text-dark-light-blue border-dark-light-blue focus:ring-dark-blue-gray w-full rounded-xl border-[3.25px] bg-transparent px-4 py-2 text-center font-bold transition-all focus:ring-4 focus:outline-none disabled:opacity-50"
						>{loading ? 'Chargement ...' : auth_type}</button
					>
				</form>
			</div>
			{#if auth_type === AuthType.login}
				<div
					class="border-dark-blue-gray flex items-center justify-center rounded-b-lg border-t px-4 py-2 text-sm text-gray-400"
				>
					<a href={resolve('/auth/reset')} class="hover:underline">Mot de passe oublié ?</a>
				</div>
			{/if}
		</div>
	</div>
</section>
