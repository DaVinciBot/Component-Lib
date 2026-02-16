<script lang="ts">
	import Table from '$lib/components/admin/Table.svelte';
	import CTAButton from '$lib/components/utils/CTAButton.svelte';
	import type { TrainingSlotListItem } from '$lib/services/training';

	export let slots: TrainingSlotListItem[] = [];
	export let statusOptions: { value: string; text: string }[] = [];
	export let slotDbInfo: any;
	export let slotActions: any[] = [];
	export let slotFilters: any[] = [];
	export let slotTableTopic = '';
	export let parseSlotItems: (data: any[]) => any[];
	export let onAddSlot = () => {};
	export let onEditSlot = (slot: TrainingSlotListItem) => {};
	export let formatSlotDate: (value: string) => string;
	export let findTrainingName: (trainingId: number, trainings: any[]) => string;
	export let trainings: any[] = [];
</script>

<section class="rounded-[28px] border border-light-blue/10 bg-dark-blue/80 p-5 sm:p-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h2 class="text-xl font-semibold text-white">Créneaux de formation</h2>
			<p class="text-sm text-light-blue/70">Planifiez, suivez et ajustez les sessions.</p>
		</div>
		<div class="flex flex-col sm:w-40 sm:flex-row sm:flex-wrap">
			<CTAButton type="button" variant="secondary" size="sm" onclick={onAddSlot}>Ajouter</CTAButton>
		</div>
	</div>

	<div class="mt-6 overflow-hidden rounded-2xl border border-light-blue/10">
		<div class="hidden md:block">
			<Table
				headers={['Début', 'Formation', 'Formateur·ice', 'Statut', 'Actions']}
				dbInfo={slotDbInfo}
				parseItems={parseSlotItems}
				actions={slotActions}
				refreshTopic={slotTableTopic}
				filters={slotFilters}
				searchable="training.name"
				emptyMessage="Aucun slot"
				size={10}
			/>
		</div>
		<div class="md:hidden">
			{#if slots.length === 0}
				<p class="px-4 py-6 text-center text-sm text-light-blue/70">Aucun slot</p>
			{:else}
				<div class="grid gap-3 p-4">
					{#each slots as slot}
						<article class="rounded-2xl border border-light-blue/10 bg-dark-blue/90 p-4">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-base font-semibold text-white">{formatSlotDate(slot.start)}</p>
									<p class="mt-1 text-sm text-light-blue/70">
										{findTrainingName(slot.training_id, trainings)}
									</p>
								</div>
								<button
									class="text-xs tracking-[0.2em] text-light-blue/70 uppercase hover:text-white"
									onclick={() => onEditSlot(slot)}
								>
									Editer
								</button>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-light-blue/70">
								<div class="flex items-center gap-2">
									{#if slot.trainer_avatar_url}
										<img
											src={slot.trainer_avatar_url}
											alt={slot.trainer_username || 'Formateur·ice'}
											class="h-6 w-6 rounded-full"
										/>
									{/if}
									<span>{slot.trainer_username || 'A definir'}</span>
								</div>
								<span class="rounded-full border border-light-blue/20 px-3 py-1 text-xs uppercase">
									{statusOptions.find((opt) => opt.value === slot.status)?.text || slot.status}
								</span>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>
