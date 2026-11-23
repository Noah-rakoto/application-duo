# Fiche 02 — Le modèle et les services

**Durée** : 2 h · **Cours** : `COURS-02-modele-et-services.md` · **À faire** : à deux

## Objectif

Décrire nos données avec des types TypeScript, puis écrire les services qui **lisent**
les catégories, les ingrédients et les recettes (avec leurs ingrédients).
Après cette fiche, **plus aucune page n'importe `firebase/firestore`**.

## 1. Les types : `src/types/recette.ts`

Écrivez les interfaces suivantes. Les champs sont ceux du cours, partie 1, plus un `id: string`.

| Interface | Contenu |
|---|---|
| `Categorie` | `id`, `libelle` |
| `Ingredient` | `id`, `libelle` |
| `Recette` | `id`, `libelle`, `image` (`string \| null`), `id_categorie`, `preparation`, `remarque`, `date_creation` et `date_derniere_modif` (`Timestamp`) |
| `RecetteIngredient` | `id`, `id_recette`, `id_ingredient`, `quantite` |
| `LigneIngredient` | `ingredient: Ingredient`, `quantite: string` (pour l'affichage) |
| `RecetteDetail` | une `Recette` **plus** `lignes: LigneIngredient[]` |

Pour `RecetteDetail`, utilisez `extends` : `interface RecetteDetail extends Recette { ... }`.

**Vérifiez** : `npm run typecheck` ne signale aucune erreur.

## 2. Des données de test

Dans la console Firebase, créez à la main :

1. la collection **`ingredients`** : `zébu`, `brèdes`, `gingembre` (champ `libelle`, en minuscules) ;
2. la collection **`recettes`**, avec un document « Romazava ». Remplissez tous les champs du cours ;
   `id_categorie` = l'ID du document `Plat` (copiez-le depuis `categories`), `image` = type `null`,
   les deux dates = type `timestamp` ;
3. la collection **`recette_ingredients`**, avec 3 documents qui relient la recette aux 3 ingrédients
   (`id_recette`, `id_ingredient`, et une `quantite` comme `"500 g"`).

Gardez **l'ID de la recette** quelque part : il servira aux tests.

## 3. `src/services/categories.ts`

```ts
export default {
  getCategories(): Promise<Categorie[]> { ... },
};
```

Utilisez une fonction `versCategorie` (cours, partie 3). Puis remplacez le code provisoire de
`HomePage.vue` (fiche 01) par un appel à `categories.getCategories()`.

**Vérifiez** : la page affiche toujours les catégories, et `HomePage.vue` n'importe plus rien de `firebase/firestore`.

## 4. `src/services/ingredients.ts`

```ts
export default {
  getIngredients(): Promise<Ingredient[]> { ... },
  trouverOuCreer(libelle: string): Promise<Ingredient> { ... },
};
```

`trouverOuCreer` servira au formulaire (fiche 04). Elle doit, dans l'ordre :

1. **normaliser** le libellé : enlever les espaces autour (`trim`) et mettre en minuscules ;
2. chercher un ingrédient qui a **exactement** ce libellé (`query` + `where`) ;
3. s'il existe, le renvoyer ;
4. sinon, le créer avec `addDoc` et renvoyer le nouvel ingrédient (avec son `id`).

**Vérifiez** : dans `HomePage.vue`, appelez temporairement `trouverOuCreer('  Riz ')` deux fois de suite.
Il ne doit y avoir **qu'un seul** document `riz` dans la console. Retirez l'appel.

## 5. `src/services/recettes.ts` (lecture)

```ts
export default {
  getRecettes(): Promise<Recette[]> { ... },
  getRecette(id: string): Promise<RecetteDetail> { ... },
};
```

- `getRecettes` : toutes les recettes, **les plus récentes d'abord**. Triez côté application avec `sort` et `date_creation.toMillis()`.
- `getRecette` remplace un `JOIN`. Elle doit :
  1. lire la recette (`getDoc`) et lever une `Error('Cette recette n\'existe pas')` si elle n'existe pas ;
  2. lire ses liens dans `recette_ingredients` (`where('id_recette', '==', id)`) ;
  3. lire tous les ingrédients et construire une `Map` ;
  4. assembler les `lignes` (ingrédient + quantité) ;
  5. renvoyer la recette avec ses lignes.

  Les étapes 1, 2 et 3 sont indépendantes : lancez-les avec **`Promise.all`**.

**Vérifiez** : dans `HomePage.vue`, affichez sous les catégories le libellé de chaque recette, et faites un
`console.log(await recettes.getRecette('<l'ID gardé>'))`. La console doit afficher la recette avec 3 lignes, chacune avec le libellé de l'ingrédient et sa quantité.
Essayez avec un ID inventé : vous devez obtenir votre message d'erreur.

## Questions

- **Q2.1** Pourquoi la `quantite` est-elle dans `recette_ingredients` et pas dans `ingredients` ?
- **Q2.2** Combien de lectures Firestore (appels à `getDoc` / `getDocs`) fait votre `getRecette` ? Combien en ferait-elle si elle lisait chaque ingrédient un par un avec `getDoc`, pour une recette de 8 ingrédients ?
- **Q2.3** Que se passerait-il dans la base si `trouverOuCreer` ne normalisait pas le libellé ? Donnez un exemple, et dites quelle recherche de la fiche 07 en souffrirait.

**Faites un commit** : `git add . && git commit -m "fiche 02 - types et services de lecture"`.
