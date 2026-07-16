<script lang="ts">
	interface Props {
		id: string;
		length?: number;
		value?: string;
		disabled?: boolean;
	}

	let { id, length = 6, value = $bindable(''), disabled = false }: Props = $props();

	const cells: (HTMLInputElement | null)[] = [];

	// Les cases ne sont pas contrôlées par Svelte après une frappe : resynchronisation
	// manuelle pour couvrir frappe, collage et remplissage automatique (one-time-code).
	function syncCells() {
		for (let i = 0; i < length; i += 1) {
			const cellEl = cells[i];
			if (cellEl) {
				cellEl.value = value.charAt(i);
			}
		}
	}

	function focusCell(index: number) {
		cells[Math.max(0, Math.min(index, length - 1))]?.focus();
	}

	function handleInput(index: number, event: Event) {
		const inserted = (event.currentTarget as HTMLInputElement).value.replace(/\D/g, '');
		value = (value.slice(0, index) + inserted + value.slice(index + 1)).slice(0, length);
		syncCells();
		focusCell(inserted.length > 0 ? index + inserted.length : index);
	}

	function handleKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace' && !(event.currentTarget as HTMLInputElement).value) {
			event.preventDefault();
			if (index > 0) {
				value = value.slice(0, index - 1) + value.slice(index);
				syncCells();
				focusCell(index - 1);
			}
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusCell(index - 1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusCell(index + 1);
		}
	}
</script>

<div class="flex items-center gap-2">
	{#each Array.from({ length }) as _unused, i (i)}
		<input
			bind:this={cells[i]}
			type="text"
			id={`${id}-${String(i)}`}
			inputmode="numeric"
			autocomplete={i === 0 ? 'one-time-code' : 'off'}
			aria-label={`Chiffre ${String(i + 1)} du code`}
			class="border-light-blue/30 bg-dark-blue/60 text-light-blue focus:border-light-blue/70 h-12 w-10 rounded-xl border text-center font-mono text-lg focus:outline-none disabled:opacity-50"
			{disabled}
			value={value.charAt(i)}
			oninput={(event) => {
				handleInput(i, event);
			}}
			onkeydown={(event) => {
				handleKeydown(i, event);
			}}
			onfocus={(event: FocusEvent & { currentTarget: HTMLInputElement }) => {
				event.currentTarget.select();
			}}
		/>
	{/each}
</div>
