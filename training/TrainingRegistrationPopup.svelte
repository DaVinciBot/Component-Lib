<script lang="ts">
	import Checkbox from '$lib/components/share/Checkbox.svelte';
	import CtaButton from '$lib/components/utils/CTAButton.svelte';

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
			class="relative max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-160 overflow-y-auto rounded-[10px] border border-light-blue/30 bg-linear-to-b from-[rgba(20,22,52,0.98)] to-[rgba(16,18,44,0.96)] px-5 py-5 text-light-blue shadow-[0_26px_60px_rgba(3,5,20,0.55)]"
		>
			<h2 class="m-0 text-sm font-semibold text-light-blue">
				Confirmation de l'inscription à la formation {trainingName}
			</h2>
			{#if showExcuse}
				<label class="mt-5 flex items-center gap-2.5 text-sm text-light-blue sm:gap-3">
					<Checkbox bind:checked={toExcuse} className="size-4" />
					<span class="cursor-pointer">J'ai besoin de me faire excuser</span>
				</label>
			{/if}
			<div class="mt-5 flex flex-row justify-end gap-3">
				<CtaButton
					variant="secondary"
					size="sm"
					fullWidth={false}
					onclick={onCancel}
					disabled={confirmDisabled}>Annuler</CtaButton
				>
				<CtaButton
					variant="primary"
					size="sm"
					fullWidth={false}
					onclick={handleConfirm}
					disabled={confirmDisabled}>{confirmLabel}</CtaButton
				>
			</div>
		</section>
	</div>
{/if}
