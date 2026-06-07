<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type CheckboxProps = Omit<HTMLInputAttributes, 'type' | 'class' | 'checked' | 'value'> & {
		checked?: boolean;
		value?: string | number;
		className?: string;
	};

	let { checked = $bindable(false), ...props }: CheckboxProps = $props() as CheckboxProps;
	props = { ...props };
	const typedProps = props as unknown as Omit<CheckboxProps, 'checked'>;
	const {
		disabled = false,
		name,
		value,
		id,
		required = false,
		className = '',
		...rest
	} = typedProps;
</script>

<input
	type="checkbox"
	class="border-light-blue checked:bg-light-blue disabled:border-dark-light-blue-faded grid size-3.5 cursor-pointer appearance-none place-content-center rounded border-[0.15em] border-solid before:size-[0.8em] before:origin-center before:content-[''] disabled:cursor-not-allowed {className}"
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
