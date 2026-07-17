<script lang="ts">
	import { onDestroy } from 'svelte';
	import { registerOverlay } from './overlay-stack.svelte';

	interface Props {
		onClose?: ((event: Event) => void) | null;
		className?: string;
	}

	const { onClose = null, className = '' }: Props = $props();

	const overlay = registerOverlay();
	onDestroy(() => {
		overlay.unregister();
	});

	const classes = $derived(
		`fixed inset-0 bg-[rgba(4,8,32,0.65)] backdrop-blur-md transition-opacity duration-150 ${
			overlay.isTop ? 'opacity-100' : 'opacity-0'
		} ${className}`
	);
</script>

{#if onClose}
	<button
		type="button"
		aria-label="Fermer"
		class={classes}
		onclick={onClose}
		onkeydown={(e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose(e);
			}
		}}
	></button>
{:else}
	<div class={classes} aria-hidden="true"></div>
{/if}
