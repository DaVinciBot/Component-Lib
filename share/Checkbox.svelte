<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type CheckboxProps = Omit<HTMLInputAttributes, 'type' | 'class' | 'checked'> & {
		checked?: boolean;
		className?: string;
	};

	let {
		checked = $bindable(false),
		disabled = false,
		name,
		value,
		id,
		required = false,
		className = '',
		...rest
	}: CheckboxProps = $props();
</script>

<input
	type="checkbox"
	class="grid size-3.75 appearance-none place-content-center rounded border-[0.15em] border-solid border-dark-light-blue bg-dark-blue before:size-[0.6em] before:origin-center before:content-[''] disabled:cursor-not-allowed disabled:border-dark-light-blue-faded {className}"
	bind:checked
	{name}
	{disabled}
	{value}
	{id}
	{required}
	{...rest}
/>

<style>
	input[type='checkbox']::before {
		transform: scale(0);
		transition:
			150ms transform ease-in-out,
			150ms opacity ease-in-out;
		box-shadow: inset 1em 1em var(--color-main-blue);
		clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
		opacity: 0;
	}

	input[type='checkbox']:checked::before {
		transform: scale(1);
		opacity: 1;
	}
</style>
