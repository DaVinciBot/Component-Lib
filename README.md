# Component-Lib — repo archivé

> ⚠ **Ce repo n'est plus utilisé.** La bibliothèque de composants vit désormais
> dans le monorepo [DaVinciBot/packages](https://github.com/DaVinciBot/packages),
> sous `packages/components`, publiée sur GitHub Packages (privé) sous le nom
> **`@davincibot/components`**.
>
> N'ouvrir ici ni PR ni release : toute modification de composant se fait dans
> `DaVinciBot/packages`.

## Ce que contient ce repo

Bibliothèque de composants Svelte des sites DaVinciBot, dans son organisation historique : des dossiers plats de
`.svelte` à la racine (`admin`, `attendance`,
`drawers`, `legal`, `markdown`, `modals`, `others`, `share`, `training`,
`utils`), sans `package.json` ni build.

Elle était consommée par les apps (`davincibot.fr`, `cash`, `formation`) comme **submodule git** monté sur
`src/lib/components/`. Ce montage n'existe plus :
plus aucune app n'a de `.gitmodules`, et la CI a retiré les
`checkout: submodules: recursive`.

## Historique de la migration

1. **Submodule** (branche `dev`) — dernier état utile, commit `ee44cd5` du 09/06/2026.
2. **Paquet npm dans ce repo** (branche `npm-package`) — première tentative de packaging avec `svelte-package`, publiée
   en `@davincibot/components@1.0.0`. Abandonnée.
3. **Monorepo `DaVinciBot/packages`** (actuel) — `packages/components`, en v3.x. Depuis la v3.0.0, seuls les composants
   **communs à plusieurs apps** y sont conservés ; les composants propres à une app ont été rapatriés dans l'app.

Les composants de ce repo qui n'ont pas été repris dans `@davincibot/components`
ont donc été déplacés dans l'app qui les utilisait, pas supprimés.

## Utiliser la bibliothèque aujourd'hui

```sh
pnpm add @davincibot/components
```

Voir le [README de `packages/components`](https://github.com/DaVinciBot/packages/blob/main/components/README.md)
pour l'installation (dont la ligne `@source` obligatoire côté Tailwind v4) et l'usage.

# Component-Lib — repo archivé

> ⚠ **Ce repo n'est plus utilisé.** La bibliothèque de composants vit désormais
> dans le monorepo [DaVinciBot/packages](https://github.com/DaVinciBot/packages),
> sous `packages/components`, publiée sur GitHub Packages (privé) sous le nom
> **`@davincibot/components`**.
>
> N'ouvrir ici ni PR ni release : toute modification de composant se fait dans
> `DaVinciBot/packages`.

## Ce que contient ce repo

Bibliothèque de composants Svelte des sites DaVinciBot, dans son organisation historique : des dossiers plats de
`.svelte` à la racine (`admin`, `attendance`,
`drawers`, `legal`, `markdown`, `modals`, `others`, `share`, `training`,
`utils`), sans `package.json` ni build.

Elle était consommée par les apps (`davincibot.fr`, `cash`, `formation`) comme **submodule git** monté sur
`src/lib/components/`. Ce montage n'existe plus :
plus aucune app n'a de `.gitmodules`, et la CI a retiré les
`checkout: submodules: recursive`.

## Historique de la migration

1. **Submodule** (branche `dev`) — dernier état utile, commit `ee44cd5` du 09/06/2026.
2. **Paquet npm dans ce repo** (branche `npm-package`) — première tentative de packaging avec `svelte-package`, publiée
   en `@davincibot/components@1.0.0`. Abandonnée.
3. **Monorepo `DaVinciBot/packages`** (actuel) — `packages/components`, en v3.x. Depuis la v3.0.0, seuls les composants
   **communs à plusieurs apps** y sont conservés ; les composants propres à une app ont été rapatriés dans l'app.

Les composants de ce repo qui n'ont pas été repris dans `@davincibot/components`
ont donc été déplacés dans l'app qui les utilisait, pas supprimés.

## Utiliser la bibliothèque aujourd'hui

```sh
pnpm add @davincibot/components
```

Voir le [README de `packages/components`](https://github.com/DaVinciBot/packages/blob/main/components/README.md)
pour l'installation (dont la ligne `@source` obligatoire côté Tailwind v4) et l'usage.
