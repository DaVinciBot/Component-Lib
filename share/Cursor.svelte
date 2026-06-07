<script lang="ts">
	import { onMount } from 'svelte';

	let cursor = $state<HTMLDivElement | null>(null);
	let cursorInner = $state<HTMLDivElement | null>(null);
	let mouseX = 0;
	let mouseY = 0;
	let cursorX = 0;
	let cursorY = 0;
	const dampening = 0.1;
	let hover = false;

	onMount(() => {
		document.addEventListener('mousemove', (e) => {
			mouseX = e.clientX;
			mouseY = e.clientY;
		});
		const buttons = document.querySelectorAll('button, a, .cursor-hover');

		buttons.forEach((button) => {
			button.addEventListener('mouseenter', () => {
				hover = true;
			});

			button.addEventListener('mouseleave', () => {
				hover = false;
			});
		});

		requestAnimationFrame(animateCursor);
	});

	function animateCursor() {
		if (!cursor || !cursorInner) {
			requestAnimationFrame(animateCursor);
			return;
		}
		cursorX += (mouseX - cursorX) * dampening;
		cursorY += (mouseY - cursorY) * dampening;

		const outerX = cursorX + 4 - 24;
		const outerY = cursorY + 4 - 24;
		const innerX = mouseX + 20 - 24;
		const innerY = mouseY + 20 - 24;
		const outerScale = hover ? '1.5' : '1';
		cursor.style.transform = `translate3d(${String(outerX)}px, ${String(outerY)}px, 0) scale(${outerScale})`;
		cursorInner.style.transform = `translate3d(${String(innerX)}px, ${String(innerY)}px, 0) scale(1)`;

		requestAnimationFrame(animateCursor);
	}
</script>

<div class="hidden sm:block">
	<div class="cursor" bind:this={cursor}></div>
	<div class="cursor-inner" bind:this={cursorInner}></div>
</div>

<style>
	:global(.enable-cursor) {
		cursor: none;
	}
	:global(.enable-cursor *):hover {
		cursor: none;
	}

	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		width: 40px;
		height: 40px;
		border: 2px solid #fff;
		border-radius: 50%;
		pointer-events: none;
		transition: transform 0.15s ease-out;
		z-index: 1000;
	}

	.cursor-inner {
		position: fixed;
		top: 0;
		left: 0;
		width: 8px;
		height: 8px;
		background-color: #fff;
		border-radius: 50%;
		pointer-events: none;
		z-index: 1000;
	}

	.cursor,
	.cursor-inner {
		mix-blend-mode: difference;
	}
</style>
