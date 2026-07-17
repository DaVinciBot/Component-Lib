<script lang="ts">
	import Carousel from '$lib/others/Carousel.svelte';
	import AislerLogo from '$lib/share/Logo/Aisler.svelte';
	import AlstomLogo from '$lib/share/Logo/Alstom.svelte';
	import FaulhaberLogo from '$lib/share/Logo/Faulhaber.svelte';
	import GotronicLogo from '$lib/share/Logo/Gotronic.svelte';
	import HDSLogo from '$lib/share/Logo/HDS.svelte';
	import IFTLogo from '$lib/share/Logo/IFT.svelte';
	import IgusLogo from '$lib/share/Logo/Igus.svelte';
	import KJLogo from '$lib/share/Logo/KJ.svelte';
	import Kurokesu from '$lib/share/Logo/Kurokesu.svelte';
	import MouserLogo from '$lib/share/Logo/Mouser.svelte';
	import RSLogo from '$lib/share/Logo/RS.svelte';

	interface SponsorsCarouselProps {
		time?: number;
		pauseOnHover?: boolean;
		small?: boolean;
	}

	/* eslint-disable prefer-const */
	let {
		time = 60,
		pauseOnHover = true,
		small = $bindable(false)
	}: SponsorsCarouselProps = $props();
	/* eslint-enable prefer-const */

	let isMobile = $state(false);
	let add_padding = $state<boolean>(false);
	if (typeof window !== 'undefined') {
		isMobile = window.innerWidth <= 768;
	}
	$effect(() => {
		if (isMobile && small) {
			small = false;
			add_padding = true;
		}
	});
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
