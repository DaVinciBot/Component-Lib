<script lang="ts">
	// Playground de dev : monter ici les composants sur lesquels on itère
	// (pnpm dev), sans dépendre d'une app hôte.
	import { Card, Checkbox, CTAButton } from '$lib';

	let checked = $state(false);
</script>

<main class="mx-auto flex max-w-2xl flex-col gap-8 p-8">
	<h1 class="text-light-blue text-2xl font-bold">@davincibot/components — playground</h1>

	<Card
		title="Carte de démonstration"
		description="Composant Card avec le thème partagé."
		image=""
		link=""
	/>

	<label class="text-light-blue flex items-center gap-2">
		<Checkbox bind:checked />
		Checkbox liée ({checked ? 'cochée' : 'décochée'})
	</label>

	<CTAButton fullWidth={false}>Bouton CTA</CTAButton>
</main>
