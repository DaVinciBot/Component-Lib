<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { userdata } from '$lib/store';
	import { hideOnClickOutside } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';

	import SideBar from '$lib/components/admin/SideBar.svelte';
	import CTAButton from '../utils/CTAButton.svelte';
	import DvbLogo from './Logo/DVBLogo.svelte';

	type TopbarProps = {
		loginRedirect?: string;
	};

	let { loginRedirect = '/admin' }: TopbarProps = $props();

	let user = $state();
	let sidebarOpen = $state(false);
	let onMobile = $state(false);
	let resizeHandler: (() => void) | null = null;

	let dropdown = $state({
		projects: false,
		infos: false
	});

	let projectsDropdownEl = $state<HTMLElement | null>(null);
	let infosDropdownEl = $state<HTMLElement | null>(null);

	const unsubscribeUserdata = userdata.subscribe((value) => {
		user = value || null;
	});

	function setupDropdown(dropdownEl: HTMLElement, activatorEl: HTMLElement) {
		// set position of the popup just below the button
		const rect = activatorEl.getBoundingClientRect();
		dropdownEl.style.top = 'calc(' + rect.bottom + 'px + 2rem)';
		dropdownEl.style.left = 'calc(' + rect.left + 'px + 0rem)';
	}

	function initDropdown(el: HTMLElement | null, activatorId: string) {
		if (!el) return;

		// Remove from current parent if not body
		if (el.parentNode !== document.body) {
			document.body.appendChild(el);
		}

		const activator = document.getElementById(activatorId);
		if (activator) {
			setupDropdown(el, activator);
		}

		if (!el.dataset.clickOutsideBound) {
			try {
				hideOnClickOutside(
					el,
					() => {
						dropdown.projects = false;
						dropdown.infos = false;
					},
					true
				);
				el.dataset.clickOutsideBound = 'true';
			} catch (e) {
				console.error('Failed to bind outside click for dropdown:', e);
			}
		}
	}

	onMount(async () => {
		onMobile = window.innerWidth < 768;

		initDropdown(projectsDropdownEl, 'ProjectsButton');
		initDropdown(infosDropdownEl, 'AssosButton');

		resizeHandler = () => {
			onMobile = window.innerWidth < 768;
			// reposition dropdowns
			const projectsButton = document.getElementById('ProjectsButton');
			const assosButton = document.getElementById('AssosButton');
			if (projectsDropdownEl && projectsButton) setupDropdown(projectsDropdownEl, projectsButton);
			if (infosDropdownEl && assosButton) setupDropdown(infosDropdownEl, assosButton);
		};
		window.addEventListener('resize', resizeHandler);
	});

	// make sure dropdowns are closed when navigating
	afterNavigate(() => {
		dropdown.projects = false;
		dropdown.infos = false;
	});

	onDestroy(() => {
		// unregister navigation handler
		dropdown.projects = false;
		dropdown.infos = false;

		// Remove dropdowns from body
		if (projectsDropdownEl && projectsDropdownEl.parentNode === document.body) {
			projectsDropdownEl.parentNode.removeChild(projectsDropdownEl);
		}
		if (infosDropdownEl && infosDropdownEl.parentNode === document.body) {
			infosDropdownEl.parentNode.removeChild(infosDropdownEl);
		}

		unsubscribeUserdata();
		if (resizeHandler) window.removeEventListener('resize', resizeHandler);
	});

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<section>
	<nav
		class="fixed top-0 right-0 left-0 z-20 w-screen border-b border-gray-700 px-2 py-2.5 backdrop-blur-lg md:px-6"
	>
		<div class="flex flex-wrap items-center justify-between">
			<div class="flex items-center justify-start">
				<button
					class="mr-2 cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:ring-2 focus:ring-gray-700 md:hidden"
					onclick={() => (sidebarOpen = !sidebarOpen)}
					aria-controls="drawer-navigation"
					aria-expanded={sidebarOpen}
				>
					<svg
						aria-hidden="true"
						class="h-6 w-6"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
							clip-rule="evenodd"
						></path>
					</svg>
					<svg
						aria-hidden="true"
						class="hidden h-6 w-6"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						></path>
					</svg>
					<span class="sr-only">Toggle sidebar</span>
				</button>
				<a href="/" class="mr-4 flex items-center justify-between">
					<DvbLogo size="h-12" />
				</a>
			</div>
			<div class="hidden items-center md:flex">
				<ul class="flex gap-10">
					<li>
						<a href="/blog" class="text-gray-400 hover:text-white">Actus</a>
					</li>
					<li>
						<button
							id="ProjectsButton"
							onclick={(e) => {
								e.stopPropagation();
								queueMicrotask;
								dropdown.projects = !dropdown.projects;
								dropdown.infos = false;
							}}
							class="flex w-full items-center justify-between rounded-sm px-3 py-2 text-gray-400 hover:text-white md:w-auto md:border-0 md:p-0"
							>Nos Projets <svg
								class="ms-2.5 h-2.5 w-2.5"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 10 6"
							>
								<path
									stroke="currentColor"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="m1 1 4 4 4-4"
								/>
							</svg></button
						>
						<div
							bind:this={projectsDropdownEl}
							data-activator="ProjectsButton"
							class="{dropdown.projects
								? ''
								: 'hidden'} dropdown bg-opacity-0 fixed z-30 w-44 divide-y divide-gray-600 rounded-lg border border-gray-700 font-normal backdrop-blur-lg"
						>
							<ul class="py-2 text-sm text-gray-400" aria-labelledby="dropdownLargeButton">
								<li>
									<a
										href="/project/coupe-de-robotique"
										class="block px-4 py-2 hover:bg-gray-600 hover:text-white">La CDR</a
									>
								</li>
								<li>
									<a
										href="/project/exodus"
										class="block px-4 py-2 hover:bg-gray-600 hover:text-white">Exodus</a
									>
								</li>
								<li>
									<a
										href="/project/cohoma"
										class="block px-4 py-2 hover:bg-gray-600 hover:text-white">CoHoMa</a
									>
								</li>
							</ul>
							<div class="py-1">
								<a href="#" class="block px-4 py-2 text-sm text-gray-500 hover:bg-gray-600"
									>Travelers</a
								>
							</div>
						</div>
					</li>
					<li>
						<button
							id="AssosButton"
							onclick={(e) => {
								e.stopPropagation();
								dropdown.infos = !dropdown.infos;
								dropdown.projects = false;
							}}
							class="flex w-full items-center justify-between rounded-sm px-3 py-2 text-gray-400 hover:text-white md:w-auto md:border-0 md:p-0"
							>À Propos<svg
								class="ms-2.5 h-2.5 w-2.5"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 10 6"
							>
								<path
									stroke="currentColor"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="m1 1 4 4 4-4"
								/>
							</svg></button
						>
						<div
							bind:this={infosDropdownEl}
							data-activator="AssosButton"
							class="{dropdown.infos
								? ''
								: 'hidden'} dropdown bg-opacity-0 fixed z-30 w-44 divide-y divide-gray-600 rounded-lg border border-gray-700 font-normal backdrop-blur-lg"
						>
							<ul class="py-2 text-sm text-gray-400" aria-labelledby="dropdownLargeButton">
								<li>
									<a href="/a-propos" class="block px-4 py-2 hover:bg-gray-600 hover:text-white"
										>L'association</a
									>
								</li>
								<li>
									<a href="/nos-ecoles" class="block px-4 py-2 hover:bg-gray-600 hover:text-white"
										>Nos écoles</a
									>
								</li>
								<li>
									<a href="#" class="block px-4 py-2 hover:bg-gray-600 hover:text-white"
										>Soutenez-nous</a
									>
								</li>
							</ul>
						</div>
					</li>
					<li>
						<a href="/sponsors" class="text-gray-400 hover:text-white">Partenaires</a>
					</li>

					<li>
						<a href="/formation" class="text-gray-400 hover:text-white">Formation</a>
					</li>

					<li>
						<a href="/contact" class="text-gray-400 hover:text-white">Contact</a>
					</li>
				</ul>
			</div>
			<div class="gap-5">
				{#if user}
					<CTAButton href="/admin" variant="secondary" size="sm">Espace membre</CTAButton>
				{:else}
					<CTAButton href={`/auth/login?redirect=${loginRedirect}`} variant="secondary" size="sm"
						>Se connecter</CTAButton
					>
				{/if}
			</div>
		</div>
	</nav>
	{#if onMobile}
		<button
			type="button"
			class="fixed inset-0 z-10 h-full w-full cursor-default border-0 bg-black bg-opacity-40 {!sidebarOpen
				? 'hidden'
				: ''}"
			aria-label="Close sidebar"
			onclick={closeSidebar}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeSidebar();
			}}
		></button>

		<SideBar
			open={sidebarOpen}
			noicon={true}
			bgClass="backdrop-blur-lg bg-opacity-0"
			activeClass="hover:backdrop-blur-lg hover:bg-opacity-20 hover:bg-gray-400"
			menu={[
				{ title: 'Actus', icon: 'newspaper', uri: '/blog' },
				{
					title: 'Nos Projets',
					icon: 'briefcase',
					sub: [
						{ title: 'La CDR', uri: '/project/coupe-de-robotique' },
						{ title: 'Exodus', uri: '/project/exodus' },
						{ title: 'CoHoMa', uri: '/project/cohoma' }
					]
				},
				{
					title: 'À Propos',
					icon: 'information-circle',
					sub: [
						{ title: "L'association", uri: '/a-propos' },
						{ title: 'Nos écoles', uri: '/nos-ecoles' },
						{ title: 'Soutenez-nous', uri: '#' }
					]
				},
				{ title: 'Partenaires', icon: 'people', uri: '/sponsors' },
				{ title: 'Formation', icon: 'academic-cap', uri: '/formation' },
				{ title: 'Contact', icon: 'mail', uri: '/contact' }
			]}
			close={closeSidebar}
		/>
	{/if}
</section>

<style>
</style>
