<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type CtaButtonProps = Omit<HTMLButtonAttributes, 'size'> & {
		variant?: 'primary' | 'secondary' | 'disabled' | 'peps' | 'peps-outline' | 'deep';
		href?: string;
		size?: 'sm' | 'md' | 'lg';
		fullWidth?: boolean;
		children?: import('svelte').Snippet;
	};

	let {
		variant = 'primary',
		href = '',
		size = 'md',
		fullWidth = true,
		type = 'button',
		disabled: disabledProp = false,
		class: className = '',
		children,
		...rest
	}: CtaButtonProps = $props();

	let widthClass = $derived(fullWidth ? 'w-full' : 'w-auto');

	let sizeClasses = $derived(
		{
			sm: 'text-sm py-1.5 px-3',
			md: 'text-lg py-2 px-6',
			lg: 'text-xl py-3 px-8'
		}[size]
	);

	let classes = $derived(
		{
			primary: 'bg-dark-light-blue text-dark-blue border-dark-light-blue',
			secondary: 'bg-transparent text-dark-light-blue border-dark-light-blue',
			disabled: 'bg-blue-gray text-light-blue border-blue-gray cursor-not-allowed opacity-70',
			peps: 'bg-light-blue text-blue-peps border-light-blue',
			'peps-outline': 'bg-transparent text-blue-peps border-light-blue',
			deep: 'bg-dark-light-blue-faded text-dark-blue border-dark-light-blue-faded opacity-95'
		}[variant]
	);

	const computedDisabled = $derived(variant === 'disabled' || disabledProp);
	const buttonClass = $derived(
		`${widthClass} ${sizeClasses} rounded-xl ${classes} border-[3.25px] font-bold tracking-wider cursor-pointer ${className}`.trim()
	);
</script>

{#if href}
	<a {href} class={`inline-block ${widthClass} no-underline`}>
		<button class={buttonClass} {type} disabled={computedDisabled} {...rest}>
			{@render children?.()}
		</button>
	</a>
{:else}
	<button class={buttonClass} {type} disabled={computedDisabled} {...rest}>
		{@render children?.()}
	</button>
{/if}

<style>
	button:disabled {
		cursor: not-allowed;
	}
</style>
