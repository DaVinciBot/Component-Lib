<script>
	import { navigating } from '$app/stores';

	/** @type {{menu?: any, open?: boolean, close?: any, noicon?: boolean, bgClass?: string, activeClass?: string}} */
	let {
		menu = $bindable([{ title: 'fill me', icon: 'timer', uri: '/admin' }]),
		open = false,
		close = () => {},
		noicon = false,
		bgClass = 'bg-gray-800',
		activeClass = 'hover:bg-gray-700'
	} = $props();

	let buttons_state = $state({});

	navigating.subscribe((value) => {
		if (value) {
			loadSidebar(value.to.route.id);
		}
	});

	function loadSidebar(path) {
		const current_route = path;
		menu = menu.map((item) => {
			if (item.uri === current_route) {
				item.active = true;
			} else {
				item.active = false;
			}
			return item;
		});
	}
</script>

<section>
	<aside
		class="fixed top-0 left-0 z-10 h-screen w-64 border-r border-gray-700 pt-14 transition-transform md:translate-x-0
			{!open ? '-translate-x-full' : 'translate-x-0'}"
		aria-label="Sidenav"
		id="drawer-navigation"
	>
		<div class="h-full overflow-y-auto px-3 py-5 {bgClass}">
			<ul class="space-y-2">
				{#each menu as item (item.title)}
					{#if item.sub}
						<li>
							<button
								type="button"
								class="group flex w-full items-center rounded-lg p-2 text-base font-medium text-white transition duration-75 {activeClass}"
								onclick={() => {
									if (buttons_state[item.title] === undefined) {
										buttons_state[item.title] = false;
									}
									buttons_state[item.title] = !buttons_state[item.title];
								}}
							>
								{#if !noicon || !item.icon}
									<ion-icon name={item.icon} class="text-2xl"></ion-icon>
								{/if}

								<span class="ml-3 flex-1 text-left whitespace-nowrap">{item.title}</span>
								<svg
									aria-hidden="true"
									class="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									></path>
								</svg>
							</button>
							<ul class="{buttons_state[item.title] ? '' : 'hidden'} space-y-2 py-2">
								{#each item.sub as sub_item (sub_item.title)}
									<li>
										<a
											href={sub_item.uri}
											class="group flex w-full items-center rounded-lg p-2 pl-11 text-base font-medium text-white transition duration-75 hover:bg-gray-700"
											onclick={() => {
												if (typeof close === 'function') close();
											}}>{sub_item.title}</a
										>
									</li>
								{/each}
							</ul>
						</li>
					{:else}
						<li>
							<a
								href={item.uri}
								class="group flex items-center rounded-lg p-2 text-base font-medium text-white hover:bg-gray-700 {item.active
									? 'bg-gray-700'
									: ''}"
								onclick={() => {
									if (typeof close === 'function') close();
								}}
							>
								{#if !noicon || !item.icon}
									<ion-icon name={item.icon} class="text-2xl"></ion-icon>
								{/if}
								<span class="ml-3">{item.title}</span>
							</a>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
		<div
			class="absolute bottom-0 left-0 z-10 hidden w-full justify-center space-x-4 bg-gray-800 p-4 lg:flex"
		></div>
	</aside>
	<script
		type="module"
		src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
	></script>
	<script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
</section>

<style>
</style>
