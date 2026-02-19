<script lang="ts">
	import type { RegistrationListItem } from '$lib/services/training';
	import { CircleCheck, CircleX, Users } from '@lucide/svelte';

	export let registrations: RegistrationListItem[] = [];
	export let isSaving: (memberId: string) => boolean;
	export let onPresenceChange: (memberId: string, present: boolean | null) => void;
	export let presenceButtonClass: (value: boolean | null, current: boolean | null) => string;
</script>

<div class="mt-4 grid gap-4 min-[1040px]:hidden">
	{#each registrations as reg}
		<div class="rounded-2xl border border-light-blue/20 bg-blue-gray/10 p-4">
			<div class="flex items-start justify-between gap-3">
				<div class="flex items-center gap-3">
					{#if reg.member_avatar_url}
						<img
							src={reg.member_avatar_url}
							alt={reg.member_username ?? 'Membre'}
							class="h-8 w-8 rounded-full"
						/>
					{/if}
					<div class="flex flex-col gap-0">
						<p class="m-0 text-sm font-semibold text-white">
							{reg.member_username ?? 'Membre'}
						</p>
						{#if reg.to_excuse}
							<span class="inline-flex text-[0.6rem] tracking-[0.25em] text-waiting uppercase">
								Excuse demandée
							</span>
						{/if}
					</div>
				</div>
				<span
					class={`inline-flex rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.25em] uppercase ${
						reg.status === 'registered'
							? 'border-registered/40 text-registered'
							: 'border-waiting/40 text-waiting'
					}`}
				>
					{reg.status === 'registered' ? 'Inscrit·e' : 'En attente'}
				</span>
			</div>
			<div class="mt-3 flex items-center justify-between text-xs text-light-blue/70">
				<span>{reg.remote ? 'Distanciel' : 'Présentiel'}</span>
			</div>
			{#if reg.status === 'registered'}
				<div class="mt-4 flex flex-wrap items-center gap-2">
					<button
						type="button"
						class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase ${presenceButtonClass(
							null,
							reg.present
						)}`}
						disabled={reg.status !== 'registered' || isSaving(reg.member_id)}
						onclick={() => onPresenceChange(reg.member_id, null)}
					>
						<Users class="size-3" />
						Non renseigné
					</button>
					<button
						type="button"
						class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase ${presenceButtonClass(
							true,
							reg.present
						)}`}
						disabled={reg.status !== 'registered' || isSaving(reg.member_id)}
						onclick={() => onPresenceChange(reg.member_id, true)}
					>
						<CircleCheck class="size-3" />
						Présent
					</button>
					<button
						type="button"
						class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase ${presenceButtonClass(
							false,
							reg.present
						)}`}
						disabled={reg.status !== 'registered' || isSaving(reg.member_id)}
						onclick={() => onPresenceChange(reg.member_id, false)}
					>
						<CircleX class="size-3" />
						Absent
					</button>
				</div>
			{/if}
		</div>
	{/each}
</div>
