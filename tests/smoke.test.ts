import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Card from '$lib/share/Card.svelte';
import Checkbox from '$lib/share/Checkbox.svelte';

// Tests de fumée : le harnais (vitest + testing-library + svelte 5) est en
// place ; la couverture composant par composant viendra ensuite.
describe('smoke', () => {
	it('renders Card with its title', () => {
		render(Card, { props: { title: 'Titre de test', description: 'desc' } });
		expect(screen.getByText('Titre de test')).toBeTruthy();
	});

	it('renders Checkbox and reflects checked state', async () => {
		render(Checkbox, { props: { checked: true } });
		const input = screen.getByRole('checkbox');
		expect((input as HTMLInputElement).checked).toBe(true);
	});
});
