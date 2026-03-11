<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'disabled' | 'peps' | 'peps-outline' | 'deep' =
		'primary';
	export let href: string = '';
	export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
	export let fullWidth: boolean = true;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabledProp: boolean = false;
	export let className: string = '';

	let widthClass = fullWidth ? 'w-full' : '';

	let sizeClasses = {
		xs: 'text-xs py-1 px-2',
		sm: 'text-sm py-1.5 px-3',
		md: 'text-lg py-2 px-6',
		lg: 'text-xl py-3 px-8'
	}[size];

	let classes = {
		primary: 'bg-dark-light-blue text-dark-blue border-dark-light-blue',
		secondary: 'bg-transparent text-dark-light-blue border-dark-light-blue',
		disabled: 'bg-blue-gray text-light-blue border-blue-gray cursor-not-allowed opacity-70',
		peps: 'bg-light-blue text-blue-peps border-light-blue',
		'peps-outline': 'bg-transparent text-blue-peps border-light-blue',
		deep: 'bg-dark-light-blue-faded text-dark-blue border-dark-light-blue-faded opacity-95'
	}[variant];

	const computedDisabled = variant === 'disabled' || disabledProp;
	const buttonClass =
		`${widthClass} ${sizeClasses} rounded-xl ${classes} border-[3.25px] font-bold cursor-pointer ${className}`.trim();
</script>

{#if href}
	<a {href} class={`inline-block ${widthClass} no-underline`}>
		<button class={buttonClass} {type} disabled={computedDisabled}>
			<slot></slot>
		</button>
	</a>
{:else}
	<button class={buttonClass} {type} disabled={computedDisabled}>
		<slot></slot>
	</button>
{/if}

<style>
	button:disabled {
		cursor: not-allowed;
	}
</style>
