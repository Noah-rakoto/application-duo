# Fiche 03 — La liste et le détail

**Durée** : 2 h · **Cours** : `COURS-03-liste-et-detail.md`

## Objectif

Remplacer la page d'accueil de test par les vraies pages de lecture : la liste des
recettes et le détail d'une recette.

## 1. Le routeur et les onglets

1. Créez `views/TabsPage.vue` avec un onglet **Recettes** (`restaurantOutline`). Inspirez-vous du `TabsPage.vue` du TP.
2. Dans `router/index.ts`, remplacez la route `/home` par les routes du cours, partie 1, avec `/` qui redirige vers `/tabs/recettes`.
3. Créez `RecetteFormPage.vue` **vide** (une `ion-page` avec un titre « Nouvelle recette ») : elle sera remplie en fiche 04.
4. Supprimez `HomePage.vue`.

## 2. `utils/format.ts`

Écrivez `formatDate(ts: Timestamp): string` (cours, partie 6).

## 3. La page Liste : `RecettesPage.vue`

Sur le modèle de `MenuPage.vue` du TP :

1. les variables `recettes`, `categories`, `chargement`, `erreur` ;
2. les catégories sont chargées **une fois** (`onMounted`), les recettes **à chaque arrivée** (`onIonViewWillEnter`) ;
3. les 4 états : chargement, erreur + « Réessayer », « Aucune recette pour le moment », liste ;
4. pour chaque recette, un `ion-item` qui mène au détail (`router-link`) et contient :
   - l'image dans un `ion-thumbnail` (rien si `image` vaut `null`) ;
   - le libellé (`h2`) ;
   - le libellé de la catégorie (cours, partie 3) ;
   - la date de création ;
5. un `ion-refresher` ;
6. un `ion-fab` « + » qui mène à `/tabs/recettes/nouvelle`.

**Vérifiez** :
- la recette « Romazava » de la fiche 02 s'affiche avec sa catégorie « Plat » ;
- le bouton + ouvre la page « Nouvelle recette » (vide) ;
- ajoutez une 2ᵉ recette **dans la console**, ouvrez le formulaire, puis revenez : la nouvelle recette apparaît, **sans tirer pour rafraîchir**.

## 4. La page Détail : `RecetteDetailPage.vue`

Sur le modèle de `PlatDetailPage.vue` du TP :

1. un `ion-back-button` vers la liste, et le libellé de la recette en titre ;
2. les 3 états : chargement, erreur, recette ;
3. le contenu, dans cet ordre :
   - l'image (si elle existe), en pleine largeur ;
   - le libellé de la catégorie dans un `ion-badge` ;
   - une section **Ingrédients** : une ligne par ingrédient, `quantité — libellé` ;
   - une section **Préparation** (retours à la ligne conservés, cours partie 5) ;
   - une section **Remarque**, **seulement si** elle n'est pas vide ;
   - en petit, en bas : « Créée le … · Modifiée le … ».

Toutes les données viennent de `recettes.getRecette(id)` (fiche 02) et de `categories.getCategories()`.

**Vérifiez** :
- dans la console Firebase, ajoutez des retours à la ligne dans la préparation : ils s'affichent dans l'application ;
- mettez une remarque vide : la section Remarque disparaît ;
- ouvrez `/tabs/recettes/inexistant` dans la barre d'adresse : le message d'erreur s'affiche, sans page blanche.

## Questions

- **Q3.1** Pourquoi les catégories se chargent-elles avec `onMounted` et les recettes avec `onIonViewWillEnter` ? Que se passerait-il si on chargeait les recettes avec `onMounted` ?
- **Q3.2** Dans la console Firebase, changez l'`id_categorie` d'une recette en `"xxx"`. Qu'affiche la liste ? Que se passerait-il sans `?.` dans `libelleCategorie` ?
- **Q3.3** Sans `white-space: pre-line`, qu'affiche la section Préparation ? Pourquoi ?

**Faites un commit** : `git add . && git commit -m "fiche 03 - liste et detail"`.
