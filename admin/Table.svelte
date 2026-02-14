<script lang="ts">
	import Checkbox from '$lib/components/share/Checkbox.svelte';
	import { tableRefresh } from '$lib/store';
	import { supabase } from '$lib/supabaseClient';
	import { hashCode, hideOnClickOutside, loadSettings, saveSettings } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	// Props

	// Optional topic name; when an app-wide event with this topic fires, the table reloads
	/** @type {{actions?: any, headers?: any, filters?: any, dbInfo?: any, searchable?: string, type?: string, type_accord?: string, parseItems?: any, size?: number, can_load?: boolean, clickable?: boolean, addNew?: any, refreshTopic?: any, showToolbar?: boolean, showPagination?: boolean}} */
	let {
		actions = [],
		headers = ['Nom', 'Email', 'Rôle', 'Actions'],
		filters = $bindable([]),
		dbInfo = {},
		searchable = 'username',
		type = 'élément',
		type_accord = 'un',
		parseItems = null,
		size = 15,
		can_load = true,
		clickable = false,
		addNew = null,
		refreshTopic = undefined,
		showToolbar = true,
		showPagination = true,
		emptyMessage = 'Aucun résultat'
	} = $props();

	// State
	let search = $state('');
	let items: Array<any[]> = $state([]);
	let current_page = $state(0);
	let total_items = $state(0);

	// derived pagination helpers
	let totalPages = $derived(Math.max(1, Math.ceil((total_items || 0) / size)));
	let pages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));
	let showingFrom = $derived(items.length ? current_page * size + 1 : 0);
	let showingTo = $derived(current_page * size + items.length);

	$effect(() => {
		if (current_page >= totalPages) current_page = Math.max(0, totalPages - 1);
	});

	// persistable filter state
	const hash = Math.abs(hashCode(JSON.stringify(filters) + JSON.stringify(dbInfo) + searchable));
	let can_update_settings = $state(false);
	const filtersStore = writable(filters);
	let hasWideFilter = $derived(filters?.some((f) => f?.wide));
	let hasFilters = $derived((filters || []).some((filter) => filter?.category !== 'hidden'));

	$effect.pre(() => {
		filtersStore.set(filters);
		if (can_update_settings) saveSettings(hash, filters);
	});

	function getFiltersString(filters: any[]) {
		let out = '';
		const tmp = JSON.parse(JSON.stringify(filters || []));
		tmp.forEach((f: any) => (f.options = f.options?.filter((o: any) => o.active)));
		tmp.forEach((f: any) => {
			if (f.options?.length) {
				out += `${f.value}:in:("${f.options.map((o: any) => o.value).join('","')}")&`;
			}
		});
		if (search) out += `${searchable}:ilike:%${search}%&`;
		return out.slice(0, -1);
	}

	async function loadPage(page: number, filter = '', step = size) {
		if (!can_load) return [];
		let query = supabase.from(dbInfo.table).select(dbInfo.key, { count: 'exact', head: false });

		if (filter) {
			const parts = filter.split('&').filter(Boolean);
			for (const p of parts) {
				const [column, operator, value] = p.split(':');
				query = query.filter(column, operator as any, value as any);
			}
		}
		if (dbInfo.ordering) {
			const [col, dir] = dbInfo.ordering.split(':');
			query = query.order(col, { ascending: dir === 'asc' });
		}

		const { data, error, count } = await query.range(page * step, (page + 1) * step - 1);
		if (error) {
			console.error(error);
			return [];
		}
		total_items = count ?? 0;
		if (!parseItems) return data || [];
		return parseItems.constructor.name === 'AsyncFunction'
			? await parseItems(data)
			: parseItems(data);
	}

	// Public API: refresh current page (optionally reset to first page)
	export async function reload({ resetPage = false } = {}) {
		if (resetPage) current_page = 0;
		items = await loadPage(current_page, getFiltersString(filters));
	}

	let mounted = false;
	filtersStore.subscribe(async () => {
		if (!mounted) return;
		await reload({ resetPage: true });
	});

	$effect.pre(() => {
		if (search.length > 0) {
			current_page = 0;
			filtersStore.set(filters);
		}
	});

	$effect(() => {
		search;
		filters;
		if (!mounted) return;
		void reload({ resetPage: true });
	});

	let unsub: (() => void) | null = null;

	onMount(async () => {
		mounted = true;
		const saved = loadSettings(hash);
		if (saved.length > 0) filters = saved;
		await reload({ resetPage: true });

		if (showToolbar) {
			const dropdown = document.querySelector<HTMLElement>('#filterDropdown-' + hash);
			if (dropdown) {
				setupDropdown();
				document.body.appendChild(dropdown);

				onresize = () => {
					setupDropdown();
				};
			}
		}

		// Subscribe to global refresh events
		if (refreshTopic) {
			unsub = tableRefresh.subscribe(async (evt) => {
				if (!evt || !evt.topic) return;
				if (evt.topic === refreshTopic) {
					// If payload asks for reset, honor it
					const resetPage = (evt?.payload as any)?.resetPage === true;
					await reload({ resetPage });
				}
			});
		}
	});

	function setupDropdown() {
		// set position of the popup just below the button
		const dropdown = document.querySelector<HTMLElement>('#filterDropdown-' + hash);
		const button = document.getElementById(`filterDropdownButton-${hash}`) as HTMLElement | null;
		if (!dropdown || !button) return;

		const wasHidden = dropdown.classList.contains('hidden');
		if (wasHidden) {
			dropdown.classList.remove('hidden');
			dropdown.style.visibility = 'hidden';
		}
		const width = dropdown.offsetWidth;
		if (wasHidden) {
			dropdown.classList.add('hidden');
			dropdown.style.visibility = '';
		}

		const rect = button.getBoundingClientRect();
		dropdown.style.top = 'calc(' + rect.bottom + 'px + 0.5rem)';
		if (window.innerWidth < 768) {
			dropdown.style.left = rect.left + 'px';
			dropdown.style.width = rect.width + 'px';
		} else if (hasWideFilter) {
			const margin = 16;
			const centeredLeft = rect.left + rect.width / 2 - width / 2;
			const clampedLeft = Math.max(
				margin,
				Math.min(centeredLeft, window.innerWidth - width - margin)
			);
			dropdown.style.left = clampedLeft + 'px';
			dropdown.style.removeProperty('width');
		} else {
			dropdown.style.left = 'calc(' + rect.left + 'px - 1.5rem)';
			dropdown.style.removeProperty('width');
		}
	}

	onDestroy(() => {
		try {
			const dropdown = document.querySelector<HTMLElement>('#filterDropdown-' + hash);
			if (dropdown) document.body.removeChild(dropdown);
		} catch (e) {
			if (!(e instanceof ReferenceError)) {
				console.error(e);
			} // else the el is prerendered
		}
		if (typeof unsub === 'function') unsub();
	});
</script>

<section class="w-full">
	<div>
		<div class="relative rounded-lg shadow-md backdrop-blur-lg">
			{#if showToolbar}
				<div
					class="flex flex-col items-center justify-between space-y-3 p-4 md:flex-row md:space-y-0 md:space-x-4"
				>
					<div class="w-full md:w-1/2">
						<form class="flex items-center">
							<label for="simple-search" class="sr-only">Rechercher</label>
							<div class="relative w-full">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<svg
										aria-hidden="true"
										class="h-5 w-5 text-gray-400"
										fill="currentColor"
										viewBox="0 0 20 20"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											fill-rule="evenodd"
											d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
								<input
									id="simple-search"
									type="text"
									class="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2 pl-10 text-sm text-white placeholder-gray-400 focus:border-primary-500"
									placeholder="Search"
									bind:value={search}
								/>
							</div>
						</form>
					</div>

					<div
						class="flex w-full shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-y-0 md:space-x-3"
					>
						{#if addNew}
							<button
								type="button"
								id="addNewButton"
								class="flex items-center justify-center rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:ring-4 focus:ring-primary-800 focus:outline-none"
								onclick={addNew}
							>
								<svg
									class="mr-2 h-3.5 w-3.5"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<path
										clip-rule="evenodd"
										fill-rule="evenodd"
										d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
									/>
								</svg>

								Ajouter {type_accord}
								{type}
							</button>
						{/if}

						{#if hasFilters}
							<button
								id={'filterDropdownButton-' + hash}
								type="button"
								class="flex w-full items-center justify-center rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-700 focus:outline-none md:w-auto"
								onclick={(e) => {
									const el = document.getElementById('filterDropdown-' + hash);
									el?.classList.toggle('hidden');
									e.stopPropagation();
									if (el) hideOnClickOutside(el);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
									class="mr-2 h-4 w-4 text-gray-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
										clip-rule="evenodd"
									/>
								</svg>
								Filtres
								<svg
									class="-mr-1 ml-1.5 h-5 w-5"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<path
										clip-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									/>
								</svg>
							</button>

							<div
								id={'filterDropdown-' + hash}
								class={`absolute z-10 hidden w-72 rounded-lg bg-gray-700 p-3 shadow ${hasWideFilter ? 'md:w-lg' : 'md:w-36'}`}
							>
								<div class={hasWideFilter ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : ''}>
									{#each filters as filter, i}
										{#if filter.category != 'hidden'}
											{#if !hasWideFilter && i > 0}
												<hr class="my-3 border-gray-600" />
											{/if}
											<div class={filter.wide ? 'p-2 md:col-span-2' : ''}>
												<h6 class="mb-3 text-sm font-medium text-white">{filter.category}</h6>
												<ul
													class={filter.wide
														? 'grid grid-cols-1 gap-2 text-sm md:grid-cols-2'
														: 'space-y-2 text-sm'}
													aria-labelledby={'filterDropdownButton-' + hash}
												>
													{#each filter.options as option}
														<li class="flex items-center">
															<Checkbox
																id={option.name}
																value={option.value}
																checked={option.active}
																className="size-4"
																onchange={(e:any) => {
																	e.preventDefault();
																	can_update_settings = true;
																	const target = e.target as HTMLInputElement | null;
																	option.active = target?.checked ?? false;
																	filtersStore.set(filters);
																}}/>
															<label
																for={option.name}
																class="ml-2 cursor-pointer text-sm font-medium text-gray-100">{option.name}</label
															>
														</li>
													{/each}
												</ul>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}

						<button
							type="button"
							class="flex items-center justify-center rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-4 focus:ring-gray-700 focus:outline-none"
							onclick={() => reload()}
							aria-label="Rafraîchir"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								xmlns:xlink="http://www.w3.org/1999/xlink"
								version="1.1"
								id="Capa_1"
								x="0px"
								y="0px"
								viewBox="0 0 513.806 513.806"
								style="enable-background:new 0 0 513.806 513.806;"
								xml:space="preserve"
								class="h-4 w-4"
								fill="currentColor"
							>
								<g>
									<path
										d="M66.074,228.731C81.577,123.379,179.549,50.542,284.901,66.045c35.944,5.289,69.662,20.626,97.27,44.244l-24.853,24.853   c-8.33,8.332-8.328,21.84,0.005,30.17c3.999,3.998,9.423,6.245,15.078,6.246h97.835c11.782,0,21.333-9.551,21.333-21.333V52.39   c-0.003-11.782-9.556-21.331-21.338-21.329c-5.655,0.001-11.079,2.248-15.078,6.246L427.418,65.04   C321.658-29.235,159.497-19.925,65.222,85.835c-33.399,37.467-55.073,83.909-62.337,133.573   c-2.864,17.607,9.087,34.202,26.693,37.066c1.586,0.258,3.188,0.397,4.795,0.417C50.481,256.717,64.002,244.706,66.074,228.731z"
									/>
									<path
										d="M479.429,256.891c-16.108,0.174-29.629,12.185-31.701,28.16C432.225,390.403,334.253,463.24,228.901,447.738   c-35.944-5.289-69.662-20.626-97.27-44.244l24.853-24.853c8.33-8.332,8.328-21.84-0.005-30.17   c-3.999-3.998-9.423-6.245-15.078-6.246H43.568c-11.782,0-21.333,9.551-21.333,21.333v97.835   c0.003,11.782,9.556,21.331,21.338,21.329c5.655-0.001,11.079-2.248,15.078-6.246l27.733-27.733   c105.735,94.285,267.884,85.004,362.17-20.732c33.417-37.475,55.101-83.933,62.363-133.615   c2.876-17.605-9.064-34.208-26.668-37.084C482.655,257.051,481.044,256.91,479.429,256.891z"
									/>
								</g></svg
							>
						</button>
					</div>
				</div>
			{/if}

			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-gray-400">
					<thead class="bg-gray-700 text-xs text-gray-400 uppercase">
						<tr>
							{#each headers as item}
								{#if item === 'Actions'}
									<th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
								{:else}
									<th scope="col" class="px-4 py-3">{item}</th>
								{/if}
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each items as row, i}
							<tr
								class="border-b border-gray-700 {clickable ? 'cursor-pointer' : ''} max-w-52"
								onclick={clickable
									? (e) => {
											e.preventDefault();
											actions.find((a) => a.type === 'view')?.handler(e);
										}
									: null}
							>
								{#each row as cell, j}
									{#if j === 0}
										<th
											scope="row"
											class="flex items-center px-4 py-3 font-medium whitespace-nowrap text-white"
											data-utils={cell.data || ''}
										>
											{#if cell.warn}
												<svg
													class="mr-2 h-4 w-4 text-red-400"
													viewBox="0 0 20 20"
													fill="currentColor"
													role="img"
													aria-label="Aucun justificatif"
													><path
														fill-rule="evenodd"
														d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.335-.213 3.011-1.742 3.011H3.48c-1.53 0-2.492-1.676-1.743-3.01L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v4a1 1 0 01-1 1z"
														clip-rule="evenodd"
													/></svg
												>
											{/if}
											{#if cell.avatar}
												<div class="mr-2 flex h-8 w-8 items-center space-x-2">
													<img src={cell.avatar} alt="avatar" class="h-8 w-8 rounded-full" />
												</div>
											{/if}
											{#if cell.component}
												{@const CellComponent = cell.component}
												<CellComponent {...cell.props || {}} />
											{:else}
												{cell.value}
											{/if}
										</th>
									{:else}
										<td class="px-4 py-3" data-utils={cell.data || ''}>
											{#if cell.component}
												{@const CellComponent = cell.component}
												<CellComponent {...cell.props || {}} />
											{:else}
												{cell.value}
											{/if}
										</td>
									{/if}
								{/each}
								{#if actions.length == 1 && actions[0].type === 'view'}
									<td class="flex items-center justify-end px-4 py-3">
										<button
											type="button"
											class="inline-flex cursor-pointer items-center rounded-lg p-0.5 text-center text-sm font-medium text-gray-400 hover:text-gray-100 focus:outline-none"
											onclick={(e) => actions[0].handler(e)}
										>
											{actions[0].title}
										</button>
									</td>
								{:else if actions.length > 1}
									<td class="flex items-center justify-end px-4 py-3">
										<button
											type="button"
											class="inline-flex cursor-pointer items-center rounded-lg p-0.5 text-center text-sm font-medium text-gray-400 hover:text-gray-100 focus:outline-none"
											onclick={(e) => actions.find((a) => a.type === 'view')?.handler(e)}
										>
											<svg
												class="h-5 w-5"
												aria-hidden="true"
												fill="currentColor"
												viewBox="0 0 20 20"
												xmlns="http://www.w3.org/2000/svg"
												><path
													d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
												/></svg
											>
										</button>
									</td>
								{/if}
							</tr>
						{/each}
						{#if items.length === 0}
							<tr><td class="px-4 py-3 text-center" colspan={headers.length}>{emptyMessage}</td></tr
							>
						{/if}
					</tbody>
				</table>
			</div>

			{#if showPagination}
				<nav
					class="flex flex-col items-start justify-between space-y-3 p-4 md:flex-row md:items-center md:space-y-0"
					aria-label="Table navigation"
				>
					<span class="text-sm font-normal text-gray-400"
						>Affichage <span class="font-semibold text-white">{showingFrom}</span> -
						<span class="font-semibold text-white">{showingTo}</span>
						sur <span class="font-semibold text-white">{total_items}</span></span
					>
					<ul class="inline-flex items-stretch -space-x-px">
						<li>
							<button
								type="button"
								class="ml-0 flex h-full items-center justify-center rounded-l-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
								aria-disabled={current_page === 0}
								class:opacity-50={current_page === 0}
								onclick={async (e) => {
									e.preventDefault();
									if (current_page === 0) return;
									current_page = Math.max(0, current_page - 1);
									await reload();
								}}
							>
								<span class="sr-only">Previous</span>
								<svg
									class="h-5 w-5"
									aria-hidden="true"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
									><path
										fill-rule="evenodd"
										d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
							</button>
						</li>
						{#if pages.length <= 5}
							{#each pages as p}
								{#if p === current_page + 1}
									<li>
										<button
											type="button"
											aria-current="page"
											class="z-10 flex items-center justify-center border border-gray-700 bg-gray-700 px-3 py-2 text-sm leading-tight text-white"
											>{p}</button
										>
									</li>
								{:else}
									<li>
										<button
											type="button"
											class="flex items-center justify-center border border-gray-700 bg-gray-800 px-3 py-2 text-sm leading-tight text-gray-400 hover:bg-gray-700 hover:text-white"
											onclick={async (e) => {
												e.preventDefault();
												current_page = p - 1;
												await reload();
											}}>{p}</button
										>
									</li>
								{/if}
							{/each}
						{:else}
							{#if current_page !== 0}
								<li>
									<button
										type="button"
										class="flex items-center justify-center border border-gray-700 bg-gray-800 px-3 py-2 text-sm leading-tight text-gray-400 hover:bg-gray-700 hover:text-white"
										onclick={async (e) => {
											e.preventDefault();
											current_page = 0;
											await reload();
										}}>1</button
									>
								</li>
							{/if}
							<li>
								<button
									type="button"
									aria-current="page"
									class="z-10 flex items-center justify-center border border-gray-700 bg-gray-700 px-3 py-2 text-sm leading-tight text-white"
									>{current_page + 1}</button
								>
							</li>
							{#if current_page !== pages.length - 1}
								<li>
									<button
										type="button"
										class="flex items-center justify-center border border-gray-700 bg-gray-800 px-3 py-2 text-sm leading-tight text-gray-400 hover:bg-gray-700 hover:text-white"
										onclick={async (e) => {
											e.preventDefault();
											current_page = pages.length - 1;
											await reload();
										}}>{pages.length}</button
									>
								</li>
							{/if}
						{/if}
						<li>
							<button
								type="button"
								class="flex h-full items-center justify-center rounded-r-lg border border-gray-700 bg-gray-800 px-3 py-1.5 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white"
								aria-disabled={current_page >= pages.length - 1}
								class:opacity-50={current_page >= pages.length - 1}
								onclick={async (e) => {
									e.preventDefault();
									if (current_page >= pages.length - 1) return;
									current_page = Math.min(pages.length - 1, current_page + 1);
									await reload();
								}}
							>
								<span class="sr-only">Next</span>
								<svg
									class="h-5 w-5"
									aria-hidden="true"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
									><path
										fill-rule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clip-rule="evenodd"
									/></svg
								>
							</button>
						</li>
					</ul>
				</nav>
			{/if}
		</div>
	</div>
</section>
