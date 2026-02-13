<script lang="ts">
	import { CircleCheck, CircleX, Users } from '@lucide/svelte';

	/** @type {{memberId: string, present: boolean | null, status: string, isSaving?: boolean, onChange: (memberId: string, present: boolean | null) => void, presenceButtonClass: (value: boolean | null, current: boolean | null) => string}} */
	let { memberId, present, status, isSaving = false, onChange, presenceButtonClass } = $props();
</script>

{#if status === 'registered'}
	<div class="flex flex-wrap items-center justify-end gap-2">
		<button
			type="button"
			class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase ${presenceButtonClass(
				null,
				present
			)}`}
			disabled={isSaving}
			onclick={() => onChange(memberId, null)}
		>
			<Users class="size-3" />
			NSP
		</button>
		<button
			type="button"
			class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase ${presenceButtonClass(
				true,
				present
			)}`}
			disabled={isSaving}
			onclick={() => onChange(memberId, true)}
		>
			<CircleCheck class="size-3" />
			Présent
		</button>
		<button
			type="button"
			class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase ${presenceButtonClass(
				false,
				present
			)}`}
			disabled={isSaving}
			onclick={() => onChange(memberId, false)}
		>
			<CircleX class="size-3" />
			Absent
		</button>
	</div>
{:else}
	<span class="text-xs text-light-blue/60">--</span>
{/if}
