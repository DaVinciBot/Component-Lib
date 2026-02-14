<script lang="ts">
	import Table from '$lib/components/admin/Table.svelte';
	import CTAButton from '$lib/components/utils/CTAButton.svelte';
	import type { TrainingListItem } from '$lib/services/training';

	export let trainings: TrainingListItem[] = [];
	export let categoryOptions: { value: string; text: string }[] = [];
	export let trainingDbInfo: any;
	export let trainingActions: any[] = [];
	export let trainingFilters: any[] = [];
	export let trainingTableTopic = '';
	export let parseTrainingItems: (data: any[]) => any[];
	export let onAddTraining = () => {};
	export let onEditTraining = (training: TrainingListItem) => {};
</script>

<section class="rounded-[28px] border border-light-blue/10 bg-dark-blue/80 p-5 sm:p-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h2 class="text-xl font-semibold text-white">Formations types</h2>
			<p class="text-sm text-light-blue/70">Gérez les contenus de référence pour les sessions.</p>
		</div>
		<div class="flex flex-col sm:w-40 sm:flex-row sm:flex-wrap">
			<CTAButton type="button" variant="secondary" size="sm" onclick={onAddTraining}>
				Ajouter
			</CTAButton>
		</div>
	</div>

	<div class="mt-6 overflow-hidden rounded-xl border border-light-blue/10">
		<div class="hidden md:block">
			<Table
				headers={['Nom', 'Catégorie', 'Description', 'Actions']}
				dbInfo={trainingDbInfo}
				parseItems={parseTrainingItems}
				actions={trainingActions}
				refreshTopic={trainingTableTopic}
				filters={trainingFilters}
				searchable="name"
				emptyMessage="Aucune formation"
				size={5}
			/>
		</div>
		<div class="md:hidden">
			{#if trainings.length === 0}
				<p class="px-4 py-6 text-center text-sm text-light-blue/70">Aucune formation</p>
			{:else}
				<div class="grid gap-3 p-4">
					{#each trainings as training}
						<article class="rounded-2xl border border-light-blue/10 bg-dark-blue/90 p-4">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-base font-semibold text-white">{training.name}</p>
									<p class="mt-1 text-xs tracking-[0.2em] text-light-blue/60 uppercase">
										{categoryOptions.find((opt) => opt.value === training.category)?.text ||
											'Autre'}
									</p>
								</div>
								<button
									class="text-xs tracking-[0.2em] text-light-blue/70 uppercase hover:text-white"
									onclick={() => onEditTraining(training)}
								>
									Editer
								</button>
							</div>
							<p class="mt-3 text-sm text-light-blue/70">
								{training.description || 'Aucune description'}
							</p>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>
