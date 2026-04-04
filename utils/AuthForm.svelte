<script>
	import { preventDefault } from 'svelte/legacy';

	import { goto } from '$app/navigation';
	import { mount, onMount } from 'svelte';

	import SucessModal from '../modals/InfoModal.svelte';

	const AuthType = {
		login: 'Login',
		register: 'Inscription',
		reset: 'Changement du mot de passe',
		oauth: 'Login avec OAuth'
	};

	/** @type {{redirect_uri?: string, auth_type?: any}} */
	let { redirect_uri = $bindable('/'), auth_type = $bindable(AuthType.login) } = $props();

	if (
		auth_type !== AuthType.login &&
		auth_type !== AuthType.register &&
		auth_type !== AuthType.reset
	) {
		// try to parse it
		auth_type = AuthType[auth_type.toLowerCase()] || AuthType.login;
	}

	let loading = $state(false);
	let email = $state('');
	let password = $state('');
	let password_confirm = $state('');

	onMount(async () => {
		redirect_uri = parseRedirectURI(redirect_uri);
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
			// If OpenID SSO parameters are present
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
				body: JSON.stringify({ password })
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

	async function handleOAuth() {
		const openIdParams = getOpenIDParams();
		// If OpenID SSO parameters are present, redirect to the original redirect_uri with auth code
		const response = await fetch('/auth/oidc/authorize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				redirect_uri: openIdParams.redirect_uri,
				client_id: openIdParams.client_id,
				response_type: openIdParams.response_type,
				state: openIdParams.state,
				scope: openIdParams.scope,
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
		if (data) {
			// Redirect to the OpenID SSO authorization URL
			window.location.href = data.redirect_uri;
		}
	}

	const handleRegister = async () => {
		try {
			loading = true;

			const response = await fetch('/auth/password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || "Impossible d'enregistrer le mot de passe.");
			}
			if (response.ok) {
				// show success message
				mount(SucessModal, {
					target: document.body,
					props: {
						message:
							'Vous avez bien été inscrit. Vous allez être redirigé vers la page de connexion.',
						onClose: () => {
							goto(`https://davincibot.fr/auth/login`);
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

	function getOpenIDParams() {
		const urlParams = new URLSearchParams(window.location.search);
		const openIdParams = {};

		// Extract OpenID SSO parameters
		const ssoParams = [
			'client_id',
			'redirect_uri',
			'response_type',
			'state',
			'scope',
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

	function buildRedirectUrlWithParams(baseUrl) {
		const openIdParams = getOpenIDParams();

		// If we have OpenID parameters, we need to redirect to the original redirect_uri with auth code
		const redirectParams = new URLSearchParams();

		// Add the authorization code (this would typically come from your auth flow)
		// For now, we'll use a placeholder - you'll need to get the actual code from Supabase

		for (const [key, value] of Object.entries(openIdParams)) {
			redirectParams.append(key, value);
		}
		const url = `${baseUrl}?${redirectParams.toString()}`;
		return url;
	}
</script>

<section class="">
	<div class="mx-auto flex flex-col items-center justify-center px-6 py-8 md:h-screen lg:py-0">
		<a class="mb-6 flex items-center text-2xl font-semibold text-white" href="/">
			<img class="mr-2 h-20" src="/white_logo.webp" alt="logo" />
		</a>
		<div
			class="w-full rounded-xl border-[3.5px] border-dark-blue-gray shadow sm:max-w-md md:mt-0 xl:p-0"
		>
			<div class="space-y-4 p-6 sm:p-8 md:space-y-6">
				<h1 class="text-xl leading-tight font-bold tracking-tight text-white md:text-2xl">
					{auth_type}
				</h1>
				<form class="space-y-4 md:space-y-6" onsubmit={preventDefault(handleAuth)}>
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-white">Votre email</label>
						<input
							type="email"
							name="email"
							id="email"
							class="block w-full rounded-lg border-2 border-dark-blue-gray bg-transparent p-2.5 text-dark-light-blue placeholder-dark-light-blue-faded focus:border-blue-500 focus:ring-blue-500"
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
							class="block w-full rounded-lg border-2 border-dark-blue-gray bg-transparent p-2.5 text-dark-light-blue placeholder-dark-light-blue-faded focus:border-blue-500 focus:ring-blue-500"
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
								class="block w-full rounded-lg border-2 border-dark-blue-gray bg-transparent p-2.5 text-dark-light-blue placeholder-dark-light-blue-faded focus:border-blue-500 focus:ring-blue-500"
								bind:value={password_confirm}
							/>
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-xl border-[3.25px] border-dark-light-blue bg-transparent px-4 py-2 text-center font-bold text-dark-light-blue transition-all hover:bg-dark-light-blue hover:text-dark-blue focus:ring-4 focus:ring-dark-blue-gray focus:outline-none disabled:opacity-50"
						>{loading ? 'Chargement ...' : auth_type}</button
					>
				</form>
			</div>
			{#if auth_type === AuthType.login}
				<div
					class="flex items-center justify-center rounded-b-lg border-t border-dark-blue-gray px-4 py-2 text-sm text-gray-400"
				>
					<a href="/auth/reset" class="hover:underline">Mot de passe oublié ?</a>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
</style>
