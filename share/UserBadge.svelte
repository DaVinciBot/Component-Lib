<script lang="ts">
	import { userdata } from '$lib/store';
	import { supabase } from '$lib/supabaseClient';
	import { hideOnClickOutside, loadUserdata } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';

	/** @type {{user?: any, fixed?: boolean}} */
	let {
		user = $bindable({
			name: 'Urbain',
			email: 'davincibot@devinci.fr',
			avatar: 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/michael-gough.png'
		}),
		fixed = true
	} = $props();

	let skip = false;
	let resizeHandler: (() => void) | null = null;

	userdata.subscribe((value) => {
		if (value) {
			user = value;
			skip = true;
		}
	});

	function setupDropdown() {
		// set position of the popup just below the button
		const dropdown = document.querySelector('#dropdown');
		const rect = document.querySelector('#user-menu-button').getBoundingClientRect();
		dropdown.style.top = 'calc(' + rect.bottom + 'px - 0.25rem)';
		dropdown.style.left = 'calc(' + rect.left + 'px - 12.05rem)';
	}

	onMount(async () => {
		const dropdown = document.querySelector('#dropdown');
		setupDropdown();
		document.body.appendChild(dropdown);

		resizeHandler = () => {
			setupDropdown();
		};
		window.addEventListener('resize', resizeHandler);

		if (skip) return;
		await loadUserdata();
	});

	onDestroy(() => {
		if (resizeHandler) window.removeEventListener('resize', resizeHandler);
	});

	const LogOut = () => {
		supabase.auth.signOut().then(() => {
			window.location.href = `/`;
		});
	};
</script>

<button
	type="button"
	class="mx-3 flex rounded-full bg-gray-800 text-sm focus:ring-3 focus:ring-gray-700 md:mr-0"
	id="user-menu-button"
	aria-expanded="false"
	onclick={(e) => {
		const dropdown = document.querySelector('#dropdown');
		dropdown.classList.toggle('hidden');
		e.stopPropagation();
		hideOnClickOutside(dropdown);
	}}
>
	<span class="sr-only">Open user menu</span>
	<img class="h-8 w-8 rounded-full" src={user.avatar} alt="user avatar" />
</button>
<!-- Dropdown menu -->
<div
	class="{fixed
		? 'fixed'
		: 'absolute'} bg-opacity-20 z-50 my-4 hidden w-56 list-none divide-y divide-gray-700 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 text-base shadow backdrop-blur-lg"
	id="dropdown"
>
	<div class="px-4 py-3">
		<span class="block text-sm font-semibold text-white">{user.name}</span>
		<span class="block truncate text-sm text-white">{user.email}</span>
	</div>
	<ul class="py-1 text-gray-300" aria-labelledby="dropdown">
		<li>
			<a
				href="/admin/profile"
				class="bg-opacity-80 block px-4 py-2 text-sm hover:bg-gray-700 hover:text-white">Profil</a
			>
		</li>
	</ul>
	{#if ['membre', 'admin', 'cdp', 'bureau'].includes(user?.role)}
		<ul class="py-1 text-gray-300" aria-labelledby="dropdown">
			<li>
				<a
					href="/admin/"
					class="bg-opacity-80 block px-4 py-2 text-sm hover:bg-gray-700 hover:text-white"
					>Pannel Admin</a
				>
			</li>
		</ul>
	{/if}
	<ul class="py-1 text-gray-300" aria-labelledby="dropdown">
		<li>
			<a
				href="#"
				class="bg-opacity-80 hover:bg-opacity-50 block px-4 py-2 text-sm hover:bg-red-700 hover:text-white"
				onclick={LogOut}>Déconnexion</a
			>
		</li>
	</ul>
</div>

<style></style>
