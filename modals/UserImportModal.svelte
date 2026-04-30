<script>
	// @ts-nocheck
	import { get_current_component } from 'svelte/internal';

	export let title = 'Ajouter des utilisateurs';
	export let permissionCategories = {};
	export let permissionPackages = [];
	export let projectOptions = [];
	export let initialPermissions = [];
	export let initialProject = '';
	export let onSubmit = async (_) => {};
	export let onClose = null;

	const current = get_current_component();

	const tabs = [
		{ id: 'simple', label: 'Simple' },
		{ id: 'bulk', label: 'Bulk' },
		{ id: 'csv', label: 'CSV' }
	];

	let activeTab = 'simple';
	let selectedPermissions = Array.isArray(initialPermissions) ? [...initialPermissions] : [];
	let selectedProject = initialProject;
	let simpleUser = { name: '', email: '', project: initialProject || '' };
	let bulkUsers = [{ name: '', email: '', project: initialProject || '' }];
	let csvUsers = [];
	let csvInput;
	let errorMessage = '';
	let isSubmitting = false;
	let recentCsvName = '';

	function close() {
		if (typeof onClose === 'function') onClose();
		current.$destroy();
	}

	function addBulkUser() {
		bulkUsers = [...bulkUsers, { name: '', email: '', project: selectedProject || '' }];
	}

	function duplicateBulkUser(index) {
		const cloned = { ...bulkUsers[index] };
		bulkUsers = [
			...bulkUsers,
			{ name: cloned.name, email: cloned.email, project: cloned.project || '' }
		];
	}

	function removeBulkUser(index) {
		if (bulkUsers.length === 1) {
			bulkUsers = [{ name: '', email: '', project: selectedProject || '' }];
			return;
		}
		bulkUsers = bulkUsers.filter((_, i) => i !== index);
	}

	function validateEmail(email) {
		const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
		return re.test(email);
	}

	function sanitizeHeader(label) {
		if (!label) return '';
		return label
			.toString()
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/[^a-z0-9]+/g, '');
	}

	function normalizeValue(value) {
		if (!value) return '';
		return value
			.toString()
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/[^a-z0-9]+/g, '');
	}

	function inferProjectFromStatuses(rawStatuses, fallbackProject = '') {
		if (!rawStatuses) return fallbackProject;
		const tokens = rawStatuses.split(/[;,]/).map(normalizeValue).filter(Boolean);
		const joinedStatuses = normalizeValue(rawStatuses);
		for (const option of projectOptions) {
			const normalizedOption = normalizeValue(option.name);
			if (!normalizedOption) continue;
			if (tokens.includes(normalizedOption) || joinedStatuses.includes(normalizedOption)) {
				return option.value;
			}
		}
		return fallbackProject;
	}

	function parseCsvRow(row) {
		const cells = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < row.length; i += 1) {
			const char = row[i];
			if (char === '"') {
				if (inQuotes && row[i + 1] === '"') {
					current += '"';
					i += 1;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				cells.push(current);
				current = '';
			} else {
				current += char;
			}
		}
		cells.push(current);
		return cells.map((value) => value.trim());
	}

	function parseCsv(content, fallbackProject = '') {
		const trimmed = content.replace(/^\uFEFF/, '').trim();
		if (!trimmed) return [];
		const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
		if (lines.length === 0) return [];
		const headers = parseCsvRow(lines[0]).map(sanitizeHeader);

		const firstNameIdx = headers.findIndex((h) => ['prenom', 'firstname', 'first'].includes(h));
		const lastNameIdx = headers.findIndex((h) => ['nom', 'lastname', 'last'].includes(h));
		const emailIdx = headers.findIndex((h) =>
			['email', 'mail', 'courriel', 'adresseemail'].includes(h)
		);
		const statusIdx = headers.findIndex((h) =>
			['statuts', 'statut', 'status', 'project', 'projects', 'projet', 'projets'].includes(h)
		);

		if (emailIdx === -1) {
			throw new Error(
				'Impossible de trouver une colonne email dans le CSV. Vérifiez que la colonne est nommée "Email".'
			);
		}

		const imported = [];
		for (let i = 1; i < lines.length; i += 1) {
			const cells = parseCsvRow(lines[i]);
			const email = (cells[emailIdx] || '').trim();
			if (!email) continue;
			const firstName = firstNameIdx !== -1 ? (cells[firstNameIdx] || '').trim() : '';
			const lastName = lastNameIdx !== -1 ? (cells[lastNameIdx] || '').trim() : '';
			const statuses = statusIdx !== -1 ? cells[statusIdx] || '' : '';
			let name = `${firstName} ${lastName}`.trim();
			if (!name) {
				const localPart = email.split('@')[0] || '';
				name = localPart.replace(/\W+/g, ' ').trim();
			}
			const project = inferProjectFromStatuses(statuses, fallbackProject);
			imported.push({ name, email, project });
		}

		if (imported.length === 0) {
			throw new Error('Aucun utilisateur valide trouvé dans le CSV.');
		}

		return imported;
	}

	function handleCsvChange(event) {
		errorMessage = '';
		recentCsvName = '';
		const file = event?.target?.files?.[0];
		if (!file) return;
		if (!/(csv|plain|text)$/i.test(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
			errorMessage = 'Le fichier doit être un CSV.';
			event.target.value = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const text = typeof reader.result === 'string' ? reader.result : '';
				const importedUsers = parseCsv(text, selectedProject || '');
				const existing = csvUsers.filter((u) => u.name || u.email || u.project);
				csvUsers = [...existing, ...importedUsers];
				recentCsvName = file.name;
				errorMessage = '';
			} catch (err) {
				errorMessage = err?.message || 'Impossible de lire le fichier CSV.';
			}
			event.target.value = '';
		};
		reader.onerror = () => {
			errorMessage = 'Impossible de lire le fichier CSV.';
			event.target.value = '';
		};
		reader.readAsText(file, 'utf-8');
	}

	function triggerCsvDialog() {
		if (csvInput) csvInput.click();
	}

	function removeCsvUser(index) {
		csvUsers = csvUsers.filter((_, i) => i !== index);
	}

	function clearCsvUsers() {
		csvUsers = [];
		recentCsvName = '';
	}

	async function submit(e) {
		e.preventDefault();
		errorMessage = '';

		const trimmedProject = (selectedProject ?? '').toString().trim();
		const finalPermissions = Array.isArray(selectedPermissions)
			? selectedPermissions.filter(Boolean)
			: [];
		let sourceUsers = [];
		if (activeTab === 'simple') {
			sourceUsers = [simpleUser];
		} else if (activeTab === 'bulk') {
			sourceUsers = bulkUsers;
		} else {
			sourceUsers = csvUsers;
		}
		const preparedUsers = sourceUsers
			.map((u) => ({
				name: (u.name || '').trim(),
				email: (u.email || '').trim(),
				project: (u.project || '').toString().trim()
			}))
			.filter((u) => u.name || u.email);

		if (preparedUsers.length === 0) {
			errorMessage = 'Ajoutez au moins un utilisateur.';
			return;
		}

		const invalid = preparedUsers.find((u) => !u.name || !validateEmail(u.email));
		if (invalid) {
			errorMessage = 'Chaque utilisateur doit avoir un nom et un email valides.';
			return;
		}

		const finalUsers = preparedUsers.map((u) => ({
			...u,
			project: u.project !== '' ? u.project : trimmedProject
		}));

		const missingProject = finalUsers.some((u) => u.project === '');
		if (missingProject) {
			errorMessage = 'Assignez un projet à chaque utilisateur ou choisissez un projet par défaut.';
			return;
		}

		isSubmitting = true;
		try {
			await onSubmit({
				permissions: finalPermissions,
				project: trimmedProject,
				users: finalUsers
			});
			close();
		} catch (err) {
			errorMessage = err?.message || "Une erreur est survenue lors de l'import.";
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center w-full h-full overflow-y-auto bg-black/40 backdrop-blur-sm"
>
	<div class="relative w-full max-w-3xl p-4">
		<div class="relative p-6 bg-gray-800 rounded-lg shadow-xl">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-white">{title}</h3>
				<button
					type="button"
					class="text-gray-400 transition-colors rounded-lg hover:text-white"
					on:click={close}
					aria-label="Fermer"
				>
					<svg
						class="w-5 h-5"
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
				</button>
			</div>

			<form class="space-y-6" on:submit={submit}>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="col-span-2 sm:col-span-1">
						<label class="block mb-2 text-sm font-medium text-white" for="permissions-details">
							Permissions
						</label>
						<details id="permissions-details" class="border border-gray-600 rounded-lg bg-gray-700">
							<summary
								class="flex w-full items-center justify-between cursor-pointer select-none p-2.5"
							>
								<span class="text-sm font-medium text-white">Sélectionner des permissions</span>
								<span class="text-xs text-gray-400"
									>{selectedPermissions.length} sélectionnée(s)</span
								>
							</summary>
							<div class="mt-3 max-h-64 overflow-y-auto pr-1">
								<div class="flex items-center justify-end mb-3">
									<button
										type="button"
										class="text-xs text-red-300 hover:text-red-200 underline"
										on:click={() => (selectedPermissions = [])}
									>
										Tout décocher
									</button>
								</div>
								{#if permissionPackages && permissionPackages.length > 0}
									<div
										class="flex flex-wrap gap-2 mb-4 p-3 mx-2.5 bg-gray-800 border border-gray-600 rounded-lg"
									>
										<p class="w-full text-xs text-gray-400 font-semibold mb-1">
											Packs prédéfinis :
										</p>
										{#each permissionPackages as pack}
											<button
												type="button"
												class="px-2 py-1 text-xs text-white bg-gray-700 hover:bg-primary-600 hover:text-white transition-colors border border-gray-500 rounded-md"
												on:click={() => (selectedPermissions = [...pack.perms])}
											>
												{pack.label}
											</button>
										{/each}
									</div>
								{/if}

								{#if Object.keys(permissionCategories || {}).length > 0}
									<div class="grid grid-cols-1 gap-4 mb-2.5">
										{#each Object.entries(permissionCategories) as [catName, perms]}
											<div class="bg-gray-800 mx-2.5 p-3 rounded-lg border border-gray-700">
												<h4
													class="text-white text-sm font-semibold mb-3 border-b border-gray-700 pb-1"
												>
													{catName}
												</h4>
												<div class="flex flex-col gap-2">
													{#each perms as perm}
														<label class="inline-flex items-center group cursor-pointer">
															<input
																type="checkbox"
																value={perm.value}
																checked={selectedPermissions.includes(perm.value)}
																on:change={(e) => {
																	if (e.target.checked) {
																		if (!selectedPermissions.includes(perm.value)) {
																			selectedPermissions = [...selectedPermissions, perm.value];
																		}
																	} else {
																		selectedPermissions = selectedPermissions.filter(
																			(v) => v !== perm.value
																		);
																	}
																}}
																class="form-checkbox h-4 w-4 text-primary-600 bg-gray-900 border-gray-500 rounded focus:ring-primary-600 focus:ring-2 transition duration-200 cursor-pointer"
															/>
															<span
																class="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors"
																>{perm.label}</span
															>
														</label>
													{/each}
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-gray-400">Aucune permission disponible.</p>
								{/if}
							</div>
						</details>
					</div>

					<div class="col-span-2 sm:col-span-1">
						<label class="block mb-2 text-sm font-medium text-white" for="bulk-project"
							>Projet</label
						>
						<select
							id="bulk-project"
							class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
							bind:value={selectedProject}
						>
							<option value="">Sélectionner un projet</option>
							{#each projectOptions as option}
								<option value={option.value}>{option.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="p-4 border border-gray-600 border-dashed rounded-lg bg-gray-900/50">
					<div class="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-700">
						{#each tabs as tab}
							<button
								type="button"
								class={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
									activeTab === tab.id
										? 'text-white bg-gray-700 border border-gray-600 border-b-transparent'
										: 'text-gray-400 hover:text-white'
								}`}
								on:click={() => {
									activeTab = tab.id;
									errorMessage = '';
								}}
							>
								{tab.label}
							</button>
						{/each}
					</div>

					{#if activeTab === 'simple'}
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="sm:col-span-1">
								<label
									class="block mb-2 text-xs font-medium text-gray-400 uppercase"
									for="simple-name">Nom</label
								>
								<input
									type="text"
									id="simple-name"
									class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
									bind:value={simpleUser.name}
									placeholder="Nom de l'utilisateur"
								/>
							</div>
							<div class="sm:col-span-1">
								<label
									class="block mb-2 text-xs font-medium text-gray-400 uppercase"
									for="simple-email">Email</label
								>
								<input
									type="email"
									id="simple-email"
									class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
									bind:value={simpleUser.email}
									placeholder="email@example.com"
								/>
							</div>
							<div class="sm:col-span-2">
								<label
									class="block mb-2 text-xs font-medium text-gray-400 uppercase"
									for="simple-project">Projet</label
								>
								<select
									id="simple-project"
									class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
									bind:value={simpleUser.project}
								>
									<option value="">Sélectionner un projet</option>
									{#each projectOptions as option}
										<option value={option.value}>{option.name}</option>
									{/each}
								</select>
							</div>
						</div>
					{:else if activeTab === 'bulk'}
						<div class="flex items-center justify-between gap-2 mb-4">
							<p class="text-sm text-gray-300">Ajoutez plusieurs utilisateurs manuellement.</p>
							<button
								type="button"
								class="px-3 py-1 text-sm font-medium text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700"
								on:click={addBulkUser}
							>
								Ajouter une ligne
							</button>
						</div>
						<div class="pr-1 space-y-4 overflow-y-auto max-h-80">
							{#each bulkUsers as user, index}
								<div
									class="grid items-end gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] grid-cols-1"
								>
									<div>
										<label
											class="block mb-2 text-xs font-medium text-gray-400 uppercase"
											for={`bulk-name-${index}`}
										>
											Nom {bulkUsers.length > 1 ? `#${index + 1}` : ''}
										</label>
										<input
											type="text"
											id={`bulk-name-${index}`}
											class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
											bind:value={user.name}
											placeholder="Nom de l'utilisateur"
										/>
									</div>
									<div>
										<label
											class="block mb-2 text-xs font-medium text-gray-400 uppercase"
											for={`bulk-email-${index}`}
										>
											Email {bulkUsers.length > 1 ? `#${index + 1}` : ''}
										</label>
										<input
											type="email"
											id={`bulk-email-${index}`}
											class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
											bind:value={user.email}
											placeholder="email@example.com"
										/>
									</div>
									<div>
										<label
											class="block mb-2 text-xs font-medium text-gray-400 uppercase"
											for={`bulk-project-${index}`}
										>
											Projet {bulkUsers.length > 1 ? `#${index + 1}` : ''}
										</label>
										<select
											id={`bulk-project-${index}`}
											class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
											bind:value={user.project}
										>
											<option value="">Sélectionner un projet</option>
											{#each projectOptions as option}
												<option value={option.value}>{option.name}</option>
											{/each}
										</select>
									</div>
									<div class="flex items-center gap-2 sm:justify-end">
										<button
											type="button"
											class="px-3 py-2 text-xs font-semibold tracking-wide text-white transition-colors border border-gray-600 rounded-md hover:bg-gray-700"
											on:click={() => duplicateBulkUser(index)}
										>
											Dupliquer
										</button>
										{#if bulkUsers.length > 1}
											<button
												type="button"
												class="px-3 py-2 text-xs font-semibold text-red-300 transition-colors border rounded-md border-red-400/40 hover:bg-red-500/20"
												on:click={() => removeBulkUser(index)}
											>
												Supprimer
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p class="text-sm text-gray-300">
									Importez un CSV et ajustez les données si nécessaire.
								</p>
								{#if recentCsvName}
									<p class="text-xs text-gray-400">Dernier import : {recentCsvName}</p>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								<button
									type="button"
									class="px-3 py-1 text-sm font-medium text-white transition-colors border rounded-md border-primary-500/40 bg-primary-500/10 hover:bg-primary-600/40"
									on:click={triggerCsvDialog}
								>
									Choisir un fichier
								</button>
								<button
									type="button"
									class="px-3 py-1 text-sm font-medium text-gray-300 transition-colors border border-gray-600 rounded-md hover:bg-gray-700"
									on:click={clearCsvUsers}
									disabled={csvUsers.length === 0}
								>
									Vider la liste
								</button>
							</div>
						</div>
						<input
							bind:this={csvInput}
							type="file"
							class="hidden"
							accept=".csv,text/csv"
							on:change={handleCsvChange}
						/>
						{#if csvUsers.length === 0}
							<p class="text-sm text-gray-400">Aucun utilisateur importé pour le moment.</p>
						{:else}
							<div class="pr-1 space-y-4 overflow-y-auto max-h-80">
								{#each csvUsers as user, index}
									<div
										class="grid items-end gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] grid-cols-1"
									>
										<div>
											<label
												class="block mb-2 text-xs font-medium text-gray-400 uppercase"
												for={`csv-name-${index}`}
											>
												Nom
											</label>
											<input
												type="text"
												id={`csv-name-${index}`}
												class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
												bind:value={user.name}
												placeholder="Nom de l'utilisateur"
											/>
										</div>
										<div>
											<label
												class="block mb-2 text-xs font-medium text-gray-400 uppercase"
												for={`csv-email-${index}`}
											>
												Email
											</label>
											<input
												type="email"
												id={`csv-email-${index}`}
												class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
												bind:value={user.email}
												placeholder="email@example.com"
											/>
										</div>
										<div>
											<label
												class="block mb-2 text-xs font-medium text-gray-400 uppercase"
												for={`csv-project-${index}`}
											>
												Projet
											</label>
											<select
												id={`csv-project-${index}`}
												class="w-full p-2.5 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500"
												bind:value={user.project}
											>
												<option value="">Sélectionner un projet</option>
												{#each projectOptions as option}
													<option value={option.value}>{option.name}</option>
												{/each}
											</select>
										</div>
										<div class="flex items-center gap-2 sm:justify-end">
											<button
												type="button"
												class="px-3 py-2 text-xs font-semibold text-red-300 transition-colors border rounded-md border-red-400/40 hover:bg-red-500/20"
												on:click={() => removeCsvUser(index)}
											>
												Supprimer
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>

				{#if errorMessage}
					<p class="text-sm text-red-400">{errorMessage}</p>
				{/if}

				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						class="px-4 py-2 text-sm font-medium text-gray-300 transition-colors border border-gray-600 rounded-lg hover:bg-gray-700"
						on:click={close}
					>
						Annuler
					</button>
					<button
						type="submit"
						class="inline-flex items-center px-5 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<svg
								class="w-4 h-4 mr-2 animate-spin"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
								></path>
							</svg>
							Import...
						{:else}
							Importer
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
