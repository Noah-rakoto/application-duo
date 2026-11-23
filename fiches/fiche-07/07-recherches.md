# Fiche 07 — Les recherches

**Durée** : 1 h 30 · **Cours** : `COURS-07-recherches.md`

## Objectif

Ajouter à la page Liste les trois recherches prévues : par **libellé**, par **catégorie** et par **ingrédient**. Elles doivent pouvoir se **combiner**.

## 1. Par libellé

Dans `RecettesPage.vue` :

1. un `ion-searchbar` dans un deuxième `ion-toolbar` du header, avec `:debounce="250"` ;
2. un `computed` `recettesFiltrees`, qui ne garde que les recettes dont le libellé contient le texte tapé ;
3. la recherche ignore les majuscules **et** les accents (fonction `normaliser`, cours partie 3 : mettez-la dans `utils/format.ts`) ;
4. la liste affiche `recettesFiltrees`, plus `recettes`.

**Vérifiez** : « ROMA », « roma » et « romazava » trouvent Romazava ; « creme » trouve « Crème brûlée ».

## 2. Par catégorie (côté Firestore)

1. Modifiez `getRecettes` pour accepter un paramètre : `getRecettes(idCategorie?: string | null)`.
   Avec un ID, la requête utilise `where('id_categorie', '==', idCategorie)`. Le tri reste côté application.
2. Dans la page, un `ion-segment` scrollable sous le header : « Toutes », puis une entrée par catégorie.
3. Quand le choix change (`@ion-change`), on recharge les recettes **avec** le filtre.

**Vérifiez** : « Dessert » n'affiche que les desserts. Combinez avec la recherche par libellé.

## 3. Par ingrédient (à travers la table de liaison)

1. Dans `services/recettes.ts`, ajoutez `getIdsRecettesAvecIngredient(idIngredient: string): Promise<Set<string>>` (cours, partie 4).
2. Dans la page :
   - chargez les ingrédients une fois (`ingredients.getIngredients()`), triés par ordre alphabétique ;
   - un `ion-select` « Ingrédient », avec un choix **Tous** (`null`) (cours, partie 6) ;
   - quand le choix change : si c'est un ingrédient, récupérez le `Set` d'ID ; sinon remettez `null` ;
   - ajoutez ce filtre dans `recettesFiltrees` (cours, partie 5).

**Vérifiez** : choisissez « zébu » : seules les recettes qui en contiennent s'affichent. Combinez avec la catégorie
et le libellé. Remettez « Tous » : toutes les recettes reviennent.

## 4. Les états

- Si **aucune recette n'existe** : « Aucune recette pour le moment » et le bouton + (fiche 03).
- Si **des recettes existent mais aucune ne passe les filtres** : « Aucune recette ne correspond à votre recherche »,
  avec un bouton **Effacer les filtres** qui remet les trois recherches à zéro.

Ce sont deux messages **différents** : testez les deux.

## 5. Bonus

- Afficher sous la barre de recherche le nombre de résultats : « 3 recettes ».
- Choisir **plusieurs** ingrédients (`:multiple="true"` sur le `ion-select`) et ne garder que les recettes qui les contiennent **tous**.

## Questions

- **Q7.1** Pourquoi la recherche par libellé se fait-elle dans l'application et pas dans Firestore ? Quel problème cela poserait-il avec 50 000 recettes ?
- **Q7.2** Pour la catégorie, on utilise `where` alors qu'on pourrait filtrer dans l'application comme pour le libellé. Quel est l'avantage de `where` ? Dans notre application (quelques dizaines de recettes), la différence se voit-elle ?
- **Q7.3** Ajoutez temporairement `orderBy('date_creation', 'desc')` à la requête filtrée par catégorie. Que se passe-t-il ? Notez le message et expliquez-le.

**Faites un commit** : `git add . && git commit -m "fiche 07 - recherches"`.
