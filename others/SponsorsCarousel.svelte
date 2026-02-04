<script>
	import HDSLogo from '$lib/components/share/Logo/HDS.svelte';
	import RSLogo from '$lib/components/share/Logo/RS.svelte';
	import FaulhaberLogo from '$lib/components/share/Logo/Faulhaber.svelte';
	import AlstomLogo from '$lib/components/share/Logo/Alstom.svelte';
	import IFTLogo from '$lib/components/share/Logo/IFT.svelte';
	import GotronicLogo from '$lib/components/share/Logo/Gotronic.svelte';
	import AislerLogo from '$lib/components/share/Logo/Aisler.svelte';
	import IgusLogo from '$lib/components/share/Logo/Igus.svelte';
	import KJLogo from '$lib/components/share/Logo/KJ.svelte';
	import MouserLogo from '$lib/components/share/Logo/Mouser.svelte';

	import Carousel from './Carousel.svelte';
	import Kurokesu from '../share/Logo/Kurokesu.svelte';

	export let time = 60;
	export let pauseOnHover = true;
	export let small = false;

	let isMobile = false;
	let add_padding = false;
	if (typeof window !== 'undefined') {
		isMobile = window.innerWidth <= 768;
	}
	$: if (isMobile && small) {
		small = false;
		add_padding = true;
	}
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
