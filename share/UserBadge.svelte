<script lang="ts">
	import { resolve } from '$app/paths';
	import { hasAnyPermission } from '$lib/permissions';
	import { userdata } from '$lib/store';
	import { getSupabaseBrowserClient } from '$lib/supabaseClient';
	import { hideOnClickOutside } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';

	interface UserBadgeUser {
		name: string;
		email: string;
		avatar: string;
		permissions?: string[];
		[key: string]: unknown;
	}

	interface UserBadgeProps {
		user?: UserBadgeUser | null;
		fixed?: boolean;
	}

	const fallbackUser: UserBadgeUser = {
		name: 'DVB',
		email: 'davincibot@devinci.fr',
		avatar: 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/michael-gough.png'
	};

	/* eslint-disable prefer-const */
	let { user = $bindable(fallbackUser), fixed = true }: UserBadgeProps = $props();
	/* eslint-enable prefer-const */

	let skip = false;
	let resizeHandler: (() => void) | null = null;
	const displayUser = $derived(user ?? fallbackUser);

	function readString(value: Record<string, unknown>, key: string, fallback: string) {
		return typeof value[key] === 'string' ? value[key] : fallback;
	}

	function readPermissions(value: Record<string, unknown>) {
		const permissions = value.permissions;
		return Array.isArray(permissions)
			? permissions.filter((permission): permission is string => typeof permission === 'string')
			: undefined;
	}

	function toUserBadgeUser(value: Record<string, unknown>): UserBadgeUser {
		const email = readString(value, 'email', fallbackUser.email);
		return {
			...value,
			name: readString(value, 'name', email.split('@')[0] ?? fallbackUser.name),
			email,
			avatar: readString(value, 'avatar', fallbackUser.avatar),
			permissions: readPermissions(value)
		};
	}

	const unsubscribe = userdata.subscribe((value) => {
		if (value) {
			user = toUserBadgeUser(value);
			skip = true;
		} else {
			user = null;
		}
	});

	function getDropdown() {
		return document.getElementById('dropdown') as HTMLDivElement | null;
	}

	function setupDropdown() {
		// set position of the popup just below the button
		const dropdown = getDropdown();
		const button = document.getElementById('user-menu-button');
		if (!dropdown || !button) {
			return;
		}
		const rect = button.getBoundingClientRect();
		dropdown.style.top = `calc(${String(rect.bottom)}px - 0.25rem)`;
		dropdown.style.left = `calc(${String(rect.left)}px - 12.05rem)`;
	}

	onMount(() => {
		const dropdown = getDropdown();
		if (!dropdown) {
			return;
		}
		setupDropdown();
		document.body.appendChild(dropdown);

		resizeHandler = () => {
			setupDropdown();
		};
		window.addEventListener('resize', resizeHandler);

		if (skip) {
			return;
		}
	});

	const LogOut = async () => {
		try {
			await getSupabaseBrowserClient().auth.signOut();
		} catch {
			// ignore
		}
		await fetch('/auth/logout', { method: 'POST' });
		userdata.set(null);
		window.location.href = `/`;
	};

	onDestroy(() => {
		unsubscribe();
		if (resizeHandler) {
			window.removeEventListener('resize', resizeHandler);
		}
	});
</script>

<button
	type="button"
	class="mx-3 flex rounded-full bg-gray-800 text-sm focus:ring-3 focus:ring-gray-700 md:mr-0"
	id="user-menu-button"
	aria-expanded="false"
	onclick={(e: MouseEvent) => {
		const dropdown = getDropdown();
		if (!dropdown) {
			return;
		}
		dropdown.classList.toggle('hidden');
		e.stopPropagation();
		hideOnClickOutside(dropdown);
	}}
>
	<span class="sr-only">Open user menu</span>
	<img class="h-8 w-8 rounded-full" src={displayUser.avatar} alt="user avatar" />
</button>
<!-- Dropdown menu -->
<div
	class="{fixed
		? 'fixed'
		: 'absolute'} bg-opacity-20 z-50 my-4 hidden w-56 list-none divide-y divide-gray-700 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 text-base shadow backdrop-blur-lg"
	id="dropdown"
>
	<div class="px-4 py-3">
		<span class="block text-sm font-semibold text-white">{displayUser.name}</span>
		<span class="block truncate text-sm text-white">{displayUser.email}</span>
	</div>
	<ul class="py-1 text-gray-300" aria-labelledby="dropdown">
		<li>
			<a
				href={resolve('/admin/profile' as '/')}
				class="bg-opacity-80 block px-4 py-2 text-sm hover:bg-gray-700 hover:text-white">Profil</a
			>
		</li>
	</ul>
	{#if hasAnyPermission( user?.permissions, ['orders.cru.self', 'orders.read.all', 'training.slot.read', 'members.profile.read.all', 'finance.read', 'blog.draft.write'] )}
		<!-- TODO: review -->
		<ul class="py-1 text-gray-300" aria-labelledby="dropdown">
			<li>
				<a
					href={resolve('/admin/' as '/')}
					class="bg-opacity-80 block px-4 py-2 text-sm hover:bg-gray-700 hover:text-white"
					>Pannel Admin</a
				>
			</li>
		</ul>
	{/if}
	<ul class="py-1 text-gray-300" aria-labelledby="dropdown">
		<li>
			<button
				type="button"
				class="bg-opacity-80 hover:bg-opacity-50 block w-full px-4 py-2 text-left text-sm hover:bg-red-700 hover:text-white"
				onclick={() => {
					void LogOut();
				}}>Déconnexion</button
			>
		</li>
	</ul>
</div>

<style></style>
