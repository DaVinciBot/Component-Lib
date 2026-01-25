<script lang="ts">
	import Checkbox from '$lib/components/share/Checkbox.svelte';

	type TrainingRegistrationPopupProps = {
		open?: boolean;
		trainingName?: string;
		showExcuse?: boolean;
		confirmLabel?: string;
		confirmDisabled?: boolean;
		onConfirm?: (toExcuse: boolean) => void;
		onCancel?: () => void;
	};

	let {
		open = false,
		trainingName = 'Titre',
		showExcuse = true,
		confirmLabel = "S'inscrire",
		confirmDisabled = false,
		onConfirm = () => {},
		onCancel = () => {}
	}: TrainingRegistrationPopupProps = $props();

	let toExcuse = $state(false);

	$effect(() => {
		if (!open) toExcuse = false;
	});

	function handleConfirm() {
		onConfirm?.(toExcuse);
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
		role="dialog"
		aria-modal="true"
	>
		<button
			type="button"
			class="absolute inset-0 bg-[rgba(4,7,32,0.7)] backdrop-blur-md"
			onclick={onCancel}
			aria-label="Fermer"
		></button>
		<section
			class="relative w-full max-w-160 rounded-[10px] border border-light-blue/30 bg-linear-to-b from-[rgba(20,22,52,0.98)] to-[rgba(16,18,44,0.96)] px-5 py-5 text-light-blue shadow-[0_26px_60px_rgba(3,5,20,0.55)]"
		>
			<h2 class="m-0 text-sm font-semibold text-light-blue">
				Confirmation de l'inscription à la formation {trainingName}
			</h2>
			{#if showExcuse}
				<label class="mt-5 flex items-center gap-3 text-sm text-light-blue">
					<Checkbox bind:checked={toExcuse} />
					<span>J'ai besoin de me faire excuser</span>
				</label>
			{/if}
			<div class="mt-5 flex flex-wrap justify-end gap-3">
				<button
					type="button"
					class="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(200,20,20,0.35)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-600/60 disabled:shadow-none"
					onclick={onCancel}
					disabled={confirmDisabled}
				>
					Annuler
				</button>
				<button
					type="button"
					class="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(20,180,90,0.35)] transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-green-600/60 disabled:shadow-none"
					onclick={handleConfirm}
					disabled={confirmDisabled}
				>
					{confirmLabel}
				</button>
			</div>
		</section>
	</div>
{/if}
