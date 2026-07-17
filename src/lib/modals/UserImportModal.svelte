<script lang="ts">
	import type { CloseHandler } from '@davincibot/lib';

	interface ProjectOption {
		name: string;
		value: string;
	}

	interface ImportUser {
		name: string;
		email: string;
		project: string;
	}

	interface SubmitPayload {
		permissions: string[];
		project: string;
		users: ImportUser[];
	}

	interface UserImportModalProps {
		title?: string;
		projectOptions?: ProjectOption[];
		initialPermissions?: string[];
		initialProject?: string;
		onSubmit?: (payload: SubmitPayload) => Promise<void> | void;
		onClose?: CloseHandler | null;
	}

	const {
		title = 'Ajouter des utilisateurs',
		projectOptions = [],
		initialPermissions = [],
		initialProject = '',
		onSubmit = () => Promise.resolve(),
		onClose = null
	}: UserImportModalProps = $props();

	const tabs = [
		{ id: 'simple', label: 'Simple' },
		{ id: 'bulk', label: 'Bulk' },
		{ id: 'csv', label: 'CSV' }
	] as const;

	let activeTab = $state<(typeof tabs)[number]['id']>('simple');
	let selectedPermissions = $derived([...initialPermissions]);
	let selectedProject = $derived(initialProject);
	const simpleUser = $derived<ImportUser>({ name: '', email: '', project: initialProject });
	let bulkUsers = $derived<ImportUser[]>([{ name: '', email: '', project: initialProject }]);
	let csvUsers = $state<ImportUser[]>([]);
	let csvInput = $state<HTMLInputElement | null>(null);
	let errorMessage = $state('');
	let isSubmitting = $state(false);
	let recentCsvName = $state('');

	function close() {
		if (typeof onClose === 'function') {
			onClose(null);
		}
	}

	function addBulkUser() {
		bulkUsers = [...bulkUsers, { name: '', email: '', project: selectedProject }];
	}

	function duplicateBulkUser(index: number) {
		const cloned = bulkUsers[index];
		if (!cloned) {
			return;
		}
		bulkUsers = [...bulkUsers, { name: cloned.name, email: cloned.email, project: cloned.project }];
	}

	function removeBulkUser(index: number) {
		if (bulkUsers.length === 1) {
			bulkUsers = [{ name: '', email: '', project: selectedProject }];
			return;
		}
		bulkUsers = bulkUsers.filter((_, i) => i !== index);
	}

	function validateEmail(email: string) {
		const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
		return re.test(email);
	}

	function sanitizeHeader(label: string | undefined) {
		if (!label) {
			return '';
		}
		return label
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/[^a-z0-9]+/g, '');
	}

	function normalizeValue(value: string | undefined) {
		if (!value) {
			return '';
		}
		return value
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/[^a-z0-9]+/g, '');
	}

	function inferProjectFromStatuses(rawStatuses: string, fallbackProject = '') {
		if (!rawStatuses) {
			return fallbackProject;
		}
		const tokens = rawStatuses.split(/[;,]/).map(normalizeValue).filter(Boolean);
		const joinedStatuses = normalizeValue(rawStatuses);
		for (const option of projectOptions) {
			const normalizedOption = normalizeValue(option.name);
			if (!normalizedOption) {
				continue;
			}
			if (tokens.includes(normalizedOption) || joinedStatuses.includes(normalizedOption)) {
				return option.value;
			}
		}
		return fallbackProject;
	}

	function parseCsvRow(row: string) {
		const cells: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < row.length; i += 1) {
			const char = row[i] ?? '';
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

	function parseCsv(content: string, fallbackProject = ''): ImportUser[] {
		const trimmed = content.replace(/^\uFEFF/, '').trim();
		if (!trimmed) {
			return [];
		}
		const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
		if (lines.length === 0) {
			return [];
		}
		const headers = parseCsvRow(lines[0] ?? '').map(sanitizeHeader);

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

		const imported: ImportUser[] = [];
		for (let i = 1; i < lines.length; i += 1) {
			const cells = parseCsvRow(lines[i] ?? '');
			const email = (cells[emailIdx] ?? '').trim();
			if (!email) {
				continue;
			}
			const firstName = firstNameIdx !== -1 ? (cells[firstNameIdx] ?? '').trim() : '';
			const lastName = lastNameIdx !== -1 ? (cells[lastNameIdx] ?? '').trim() : '';
			const statuses = statusIdx !== -1 ? (cells[statusIdx] ?? '') : '';
			let name = `${firstName} ${lastName}`.trim();
			if (!name) {
				const localPart = email.split('@')[0] ?? '';
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

	function handleCsvChange(event: Event) {
		errorMessage = '';
		recentCsvName = '';
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}
		if (!/(csv|plain|text)$/i.test(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
			errorMessage = 'Le fichier doit être un CSV.';
			input.value = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const text = typeof reader.result === 'string' ? reader.result : '';
				const importedUsers = parseCsv(text, selectedProject);
				const existing = csvUsers.filter((u) => u.name || u.email || u.project);
				csvUsers = [...existing, ...importedUsers];
				recentCsvName = file.name;
				errorMessage = '';
			} catch (err) {
				errorMessage = err instanceof Error ? err.message : 'Impossible de lire le fichier CSV.';
			}
			input.value = '';
		};
		reader.onerror = () => {
			errorMessage = 'Impossible de lire le fichier CSV.';
			input.value = '';
		};
		reader.readAsText(file, 'utf-8');
	}

	function triggerCsvDialog() {
		if (csvInput) {
			csvInput.click();
		}
	}

	function removeCsvUser(index: number) {
		csvUsers = csvUsers.filter((_, i) => i !== index);
	}

	function clearCsvUsers() {
		csvUsers = [];
		recentCsvName = '';
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';

		const trimmedProject = selectedProject.trim();
		const finalPermissions = selectedPermissions.filter(Boolean);
		const sourceUsers =
			activeTab === 'simple' ? [simpleUser] : activeTab === 'bulk' ? bulkUsers : csvUsers;
		const preparedUsers = sourceUsers
			.map((u) => ({
				name: u.name.trim(),
				email: u.email.trim(),
				project: u.project.trim()
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
			errorMessage =
				err instanceof Error ? err.message : "Une erreur est survenue lors de l'import.";
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm"
>
	<div class="relative w-full max-w-3xl p-4">
		<div class="relative rounded-lg bg-gray-800 p-6 shadow-xl">
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">{title}</h3>
				<button
					type="button"
					class="rounded-lg text-gray-400 transition-colors hover:text-white"
					onclick={close}
					aria-label="Fermer"
				>
					<svg
						class="h-5 w-5"
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

			<form class="space-y-6" onsubmit={submit}>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="col-span-2 sm:col-span-1">
						<label class="mb-2 block text-sm font-medium text-white" for="permissions-details">
							Permissions
						</label>
						<details id="permissions-details" class="rounded-lg border border-gray-600 bg-gray-700">
							<summary
								class="flex w-full cursor-pointer items-center justify-between p-2.5 select-none"
							>
								<span class="text-sm font-medium text-white">Sélectionner des permissions</span>
								<span class="text-xs text-gray-400"
									>{selectedPermissions.length} sélectionnée(s)</span
								>
							</summary>
							<div class="mt-3 max-h-64 overflow-y-auto pr-1">
								<div class="mb-3 flex items-center justify-end">
									<button
										type="button"
										class="text-xs text-red-300 underline hover:text-red-200"
										onclick={() => (selectedPermissions = [])}
									>
										Tout décocher
									</button>
								</div>
							</div>
						</details>
					</div>

					<div class="col-span-2 sm:col-span-1">
						<label class="mb-2 block text-sm font-medium text-white" for="bulk-project"
							>Projet</label
						>
						<select
							id="bulk-project"
							class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
							bind:value={selectedProject}
						>
							<option value="">Sélectionner un projet</option>
							{#each projectOptions as option (option.value)}
								<option value={option.value}>{option.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="rounded-lg border border-dashed border-gray-600 bg-gray-900/50 p-4">
					<div class="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-700">
						{#each tabs as tab (tab.id)}
							<button
								type="button"
								class={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
									activeTab === tab.id
										? 'border border-gray-600 border-b-transparent bg-gray-700 text-white'
										: 'text-gray-400 hover:text-white'
								}`}
								onclick={() => {
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
									class="mb-2 block text-xs font-medium text-gray-400 uppercase"
									for="simple-name">Nom</label
								>
								<input
									type="text"
									id="simple-name"
									class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
									bind:value={simpleUser.name}
									placeholder="Nom de l'utilisateur"
								/>
							</div>
							<div class="sm:col-span-1">
								<label
									class="mb-2 block text-xs font-medium text-gray-400 uppercase"
									for="simple-email">Email</label
								>
								<input
									type="email"
									id="simple-email"
									class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
									bind:value={simpleUser.email}
									placeholder="email@example.com"
								/>
							</div>
							<div class="sm:col-span-2">
								<label
									class="mb-2 block text-xs font-medium text-gray-400 uppercase"
									for="simple-project">Projet</label
								>
								<select
									id="simple-project"
									class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
									bind:value={simpleUser.project}
								>
									<option value="">Sélectionner un projet</option>
									{#each projectOptions as option (option.value)}
										<option value={option.value}>{option.name}</option>
									{/each}
								</select>
							</div>
						</div>
					{:else if activeTab === 'bulk'}
						<div class="mb-4 flex items-center justify-between gap-2">
							<p class="text-sm text-gray-300">Ajoutez plusieurs utilisateurs manuellement.</p>
							<button
								type="button"
								class="bg-primary-600 hover:bg-primary-700 rounded-md px-3 py-1 text-sm font-medium text-white transition-colors"
								onclick={addBulkUser}
							>
								Ajouter une ligne
							</button>
						</div>
						<div class="max-h-80 space-y-4 overflow-y-auto pr-1">
							{#each bulkUsers as user, index (`bulk-${String(index)}`)}
								<div
									class="grid grid-cols-1 items-end gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
								>
									<div>
										<label
											class="mb-2 block text-xs font-medium text-gray-400 uppercase"
											for={`bulk-name-${String(index)}`}
										>
											Nom {bulkUsers.length > 1 ? `#${String(index + 1)}` : ''}
										</label>
										<input
											type="text"
											id={`bulk-name-${String(index)}`}
											class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
											bind:value={user.name}
											placeholder="Nom de l'utilisateur"
										/>
									</div>
									<div>
										<label
											class="mb-2 block text-xs font-medium text-gray-400 uppercase"
											for={`bulk-email-${String(index)}`}
										>
											Email {bulkUsers.length > 1 ? `#${String(index + 1)}` : ''}
										</label>
										<input
											type="email"
											id={`bulk-email-${String(index)}`}
											class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
											bind:value={user.email}
											placeholder="email@example.com"
										/>
									</div>
									<div>
										<label
											class="mb-2 block text-xs font-medium text-gray-400 uppercase"
											for={`bulk-project-${String(index)}`}
										>
											Projet {bulkUsers.length > 1 ? `#${String(index + 1)}` : ''}
										</label>
										<select
											id={`bulk-project-${String(index)}`}
											class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
											bind:value={user.project}
										>
											<option value="">Sélectionner un projet</option>
											{#each projectOptions as option (option.value)}
												<option value={option.value}>{option.name}</option>
											{/each}
										</select>
									</div>
									<div class="flex items-center gap-2 sm:justify-end">
										<button
											type="button"
											class="rounded-md border border-gray-600 px-3 py-2 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-gray-700"
											onclick={() => {
												duplicateBulkUser(index);
											}}
										>
											Dupliquer
										</button>
										{#if bulkUsers.length > 1}
											<button
												type="button"
												class="rounded-md border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
												onclick={() => {
													removeBulkUser(index);
												}}
											>
												Supprimer
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
									class="border-primary-500/40 bg-primary-500/10 hover:bg-primary-600/40 rounded-md border px-3 py-1 text-sm font-medium text-white transition-colors"
									onclick={triggerCsvDialog}
								>
									Choisir un fichier
								</button>
								<button
									type="button"
									class="rounded-md border border-gray-600 px-3 py-1 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
									onclick={clearCsvUsers}
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
							onchange={handleCsvChange}
						/>
						{#if csvUsers.length === 0}
							<p class="text-sm text-gray-400">Aucun utilisateur importé pour le moment.</p>
						{:else}
							<div class="max-h-80 space-y-4 overflow-y-auto pr-1">
								{#each csvUsers as user, index (`csv-${String(index)}`)}
									<div
										class="grid grid-cols-1 items-end gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
									>
										<div>
											<label
												class="mb-2 block text-xs font-medium text-gray-400 uppercase"
												for={`csv-name-${String(index)}`}
											>
												Nom
											</label>
											<input
												type="text"
												id={`csv-name-${String(index)}`}
												class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
												bind:value={user.name}
												placeholder="Nom de l'utilisateur"
											/>
										</div>
										<div>
											<label
												class="mb-2 block text-xs font-medium text-gray-400 uppercase"
												for={`csv-email-${String(index)}`}
											>
												Email
											</label>
											<input
												type="email"
												id={`csv-email-${String(index)}`}
												class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
												bind:value={user.email}
												placeholder="email@example.com"
											/>
										</div>
										<div>
											<label
												class="mb-2 block text-xs font-medium text-gray-400 uppercase"
												for={`csv-project-${String(index)}`}
											>
												Projet
											</label>
											<select
												id={`csv-project-${String(index)}`}
												class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white"
												bind:value={user.project}
											>
												<option value="">Sélectionner un projet</option>
												{#each projectOptions as option (option.value)}
													<option value={option.value}>{option.name}</option>
												{/each}
											</select>
										</div>
										<div class="flex items-center gap-2 sm:justify-end">
											<button
												type="button"
												class="rounded-md border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
												onclick={() => {
													removeCsvUser(index);
												}}
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
						class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
						onclick={close}
					>
						Annuler
					</button>
					<button
						type="submit"
						class="bg-primary-600 hover:bg-primary-700 inline-flex items-center rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<svg
								class="mr-2 h-4 w-4 animate-spin"
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
