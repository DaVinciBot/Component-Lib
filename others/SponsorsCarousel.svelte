<script>
	import AislerLogo from '$lib/components/share/Logo/Aisler.svelte';
	import AlstomLogo from '$lib/components/share/Logo/Alstom.svelte';
	import FaulhaberLogo from '$lib/components/share/Logo/Faulhaber.svelte';
	import GotronicLogo from '$lib/components/share/Logo/Gotronic.svelte';
	import HDSLogo from '$lib/components/share/Logo/HDS.svelte';
	import IFTLogo from '$lib/components/share/Logo/IFT.svelte';
	import IgusLogo from '$lib/components/share/Logo/Igus.svelte';
	import KJLogo from '$lib/components/share/Logo/KJ.svelte';
	import Kurokesu from '$lib/components/share/Logo/Kurokesu.svelte';
	import MouserLogo from '$lib/components/share/Logo/Mouser.svelte';
	import RSLogo from '$lib/components/share/Logo/RS.svelte';
	import Carousel from './Carousel.svelte';

	/**@type {{time?: number, pauseOnHover?: boolean, small?: boolean}} */
	let { time = 60, pauseOnHover = true, small = false } = $props();

	let isMobile = false;
	let add_padding = false;
	if (typeof window !== 'undefined') {
		isMobile = window.innerWidth <= 768;
	}

	small = $derived(isMobile);
	add_padding = $derived(isMobile);
</script>

<Carousel {time} {pauseOnHover} {small}>
	<HDSLogo {small} />
	<RSLogo {small} />
	<FaulhaberLogo {small} />
	<AlstomLogo {small} />
	<IFTLogo {small} />
	<Kurokesu {small} />
	<GotronicLogo {small} />
	<AislerLogo {small} />
	<IgusLogo {small} />
	<KJLogo {small} />
	<MouserLogo {small} />
</Carousel>
<div class={add_padding ? 'h-12' : ''}></div>
