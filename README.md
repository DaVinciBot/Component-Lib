# @davincibot/components

Bibliothèque de composants Svelte 5 des sites DaVinciBot, publiée sur
GitHub Packages (privé) via `svelte-package`. Remplace l'ancienne consommation
par submodule git.

## Installation (dans une app SvelteKit)

```sh
pnpm add @davincibot/components
```

(peers `@davincibot/lib`, `@davincibot/database-types`, `@lucide/svelte`, etc.
sont auto-installés par pnpm ≥ 10.)

Dans le CSS global de l'app :

```css
@import 'tailwindcss';
@import '@davincibot/components/theme.css';
@source '../../node_modules/@davincibot/components/dist';
```

⚠ La ligne `@source` est **obligatoire** : Tailwind v4 ne scanne pas
`node_modules` — sans elle les classes utilisées par les composants sont
purgées silencieusement.

## Usage

```svelte
<script lang="ts">
	import { Table, Calendar, CTAButton, type Filter } from '@davincibot/components';
</script>
```

Tous les composants sont des exports nommés (le `Table` markdown est exporté
`MarkdownTable`). Les types partagés des composants sont exportés depuis leurs
`<script lang="ts" module>` et ré-exposés par le barrel.

## Développement

```sh
NPM_TOKEN=<pat read:packages> pnpm install
pnpm dev          # playground (src/routes)
pnpm check        # svelte-check
pnpm lint         # prettier + eslint
pnpm test:unit    # vitest
pnpm build        # svelte-kit sync && svelte-package && publint
```

Itérer contre une app hôte : depuis l'app, `pnpm link ../component-lib`
(hot-reload via vite dev ; si erreur svelte « two instances », ajouter
`resolve.dedupe: ['svelte']` au vite config de l'app).

## Versioning & publication

Changesets : chaque PR de feature inclut `pnpm changeset` ; au merge sur
`main`, la PR « Version Packages » est ouverte par `release.yml` ; à son merge,
`publish.yml` publie via le workflow réutilisable
`DaVinciBot/shared-workflows/publish-npm.yml` (idempotent).
