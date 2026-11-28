# Fiche 05 — Éditer et supprimer

**Durée** : 1 h 30 · **Cours** : `COURS-05-editer-et-supprimer.md`

## Objectif

Compléter le CRUD : éditer une recette avec le formulaire de la fiche 04, et la supprimer proprement.

## 1. Les services

Dans `services/recettes.ts`, ajoutez :

```ts
modifierRecette(id: string, recette: NouvelleRecette): Promise<void>
supprimerRecette(id: string): Promise<void>
```

**`modifierRecette`**, dans l'ordre :

1. obtenir les ingrédients avec `trouverOuCreer` (comme à la création) ;
2. lire les anciens liens de la recette ;
3. dans **un seul batch** :
   - `update` de la recette, avec `date_derniere_modif: serverTimestamp()` et **sans** `date_creation` ;
   - `delete` de chaque ancien lien ;
   - `set` d'un nouveau lien par ligne ;
4. `commit`.

**`supprimerRecette`** : les liens puis la recette, dans un seul batch (cours, partie 3).

Une partie du code de `creerRecette` et de `modifierRecette` est identique (obtenir les ingrédients, préparer les liens).
Sortez-la dans une **fonction interne** au fichier, plutôt que de la copier.

## 2. Le formulaire en mode édition

Dans `RecetteFormPage.vue` :

1. déterminez le mode à partir de `params.id` (cours, partie 1) ;
2. titre : « Nouvelle recette » ou « Éditer la recette » ;
3. en édition : chargez la recette au montage et pré-remplissez **tous** les champs, lignes d'ingrédients comprises ;
   affichez un `ion-spinner` pendant le chargement ;
4. `enregistrer()` appelle `creerRecette` **ou** `modifierRecette` selon le mode ;
5. après une édition, revenez au détail avec `ionRouter.navigate(..., 'back')` (ou `ionRouter.back()`), pour ne pas empiler une deuxième page Détail.

## 3. Les boutons du détail

Dans `RecetteDetailPage.vue`, ajoutez dans la barre du haut (`ion-buttons slot="end"`) :

- **Éditer** (`createOutline`) : un `router-link` vers `/tabs/recettes/<id>/modifier` ;
- **Supprimer** (`trashOutline`, `color="danger"`) : une alerte de confirmation (cours, partie 5), puis
  un chargement, `supprimerRecette`, un toast « Recette supprimée », et le retour à la liste
  (`ionRouter.navigate('/tabs/recettes', 'back', 'replace')`).

Le détail doit se **recharger** quand on revient du formulaire : le bon hook est le même que pour la liste.

**Vérifiez** :
- éditez une recette, retirez un ingrédient, changez une quantité : le détail est à jour en revenant ;
  dans la console, l'ancien lien a disparu et il n'y a **que** les liens des lignes restantes ;
- `date_creation` n'a **pas** changé, `date_derniere_modif` oui ;
- supprimez une recette : elle disparaît de la liste, et **aucun** document de `recette_ingredients` ne pointe plus vers son ID ;
- annulez une suppression : rien ne change.

## Questions

- **Q5.1** On supprime tous les liens puis on les recrée, au lieu de calculer ce qui a changé. Quel est l'avantage ? Quel est l'inconvénient (pensez aux ID des documents `recette_ingredients`) ?
- **Q5.2** Que se passerait-il si `modifierRecette` utilisait `batch.set` au lieu de `batch.update` sur la recette, sans renvoyer `date_creation` ?
- **Q5.3** Après une suppression, pourquoi naviguer avec `'replace'` ? Que se passerait-il avec le bouton retour d'Android sinon ?

**Faites un commit** : `git add . && git commit -m "fiche 05 - edition et suppression"`.
