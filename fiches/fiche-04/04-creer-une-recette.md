# Fiche 04 — Créer une recette

**Durée** : 2 h · **Cours** : `COURS-04-creer-une-recette.md`

## Objectif

Remplir la page `RecetteFormPage.vue` pour **créer** une recette avec sa catégorie, ses
ingrédients, sa préparation et sa remarque. L'image viendra en fiche 06, l'édition en fiche 05.

## 1. Le type des données du formulaire

Dans `types/recette.ts`, ajoutez :

```ts
export interface NouvelleRecette {
  libelle: string;
  image: string | null;
  id_categorie: string;
  preparation: string;
  remarque: string;
  ingredients: { libelle: string; quantite: string }[];   // les lignes du formulaire
}
```

C'est ce que la page **envoie au service**. Ce n'est pas ce qui est stocké : le service le découpe en documents.

## 2. Le service : `creerRecette`

Dans `services/recettes.ts`, ajoutez :

```ts
creerRecette(nouvelle: NouvelleRecette): Promise<string>   // renvoie l'ID de la recette créée
```

Elle doit, dans l'ordre :

1. pour chaque ligne, obtenir l'ingrédient avec `ingredients.trouverOuCreer(libelle)` (fiche 02) ;
2. ouvrir un batch ;
3. préparer la référence de la recette avec `doc(collection(...))`, pour connaître son ID ;
4. prévoir la création de la recette (`batch.set`), avec les deux dates en `serverTimestamp()` ;
   les textes sont enregistrés **sans espaces autour** (`trim`) ;
5. prévoir la création d'un `recette_ingredients` par ligne ;
6. envoyer le batch (`commit`) et renvoyer l'ID.

## 3. Le formulaire

Dans `RecetteFormPage.vue` :

1. un `ion-back-button` vers la liste, et le titre « Nouvelle recette » ;
2. les catégories, chargées au montage, pour remplir le `ion-select` ;
3. les champs, dans cet ordre : **libellé**, **catégorie**, **ingrédients** (lignes quantité + libellé,
   bouton corbeille, bouton « + Ajouter un ingrédient »), **préparation**, **remarque** (facultative) ;
4. un bouton « Enregistrer » en bas (`expand="block"`), désactivé pendant l'envoi.

## 4. La validation

Écrivez `valider()` (cours, partie 3). Les règles :

| Champ | Règle | Message |
|---|---|---|
| libellé | non vide | « Le libellé est obligatoire » |
| catégorie | choisie | « Choisissez une catégorie » |
| ingrédients | **au moins une** ligne avec un libellé non vide | « Ajoutez au moins un ingrédient » |
| préparation | non vide | « La préparation est obligatoire » |

Les lignes **entièrement vides** sont ignorées (on ne les envoie pas au service).

## 5. Enregistrer

Écrivez `enregistrer()` sur le modèle de `envoyer()` dans `PanierPage.vue` du TP :

1. si `valider()` échoue : on s'arrête, les messages s'affichent sous les champs ;
2. un `loadingController` « Enregistrement… » ;
3. appel de `recettes.creerRecette(...)` ;
4. en cas de succès : un toast vert « Recette enregistrée », puis aller sur le **détail** de la nouvelle recette
   (`ionRouter.navigate(\`/tabs/recettes/${id}\`, 'forward', 'replace')`) ;
5. en cas d'erreur : un toast rouge avec le message ;
6. dans tous les cas : fermer le chargement (`finally`).

**Vérifiez** :
- formulaire vide + Enregistrer : 4 messages d'erreur, **rien** n'apparaît dans la console Firebase ;
- une recette avec 3 ingrédients, dont un nouveau (« vanille ») : dans la console, 1 document dans `recettes`,
  3 dans `recette_ingredients`, et `vanille` dans `ingredients` ;
- une recette avec l'ingrédient « Zébu » (majuscule) : **pas** de deuxième `zébu` dans `ingredients` ;
- après l'enregistrement, le bouton retour du détail ramène à la liste, et la nouvelle recette y est **en premier**.

## Questions

- **Q4.1** Sans batch (avec un `addDoc` pour la recette puis un `addDoc` par ingrédient), que pourrait-il rester dans la base si le téléphone perd le réseau au milieu ? Quelle conséquence à l'écran ?
- **Q4.2** Pourquoi `serverTimestamp()` plutôt que `new Date()` ? Que verrait-on dans la liste si un téléphone avait une heure fausse d'un jour et qu'on utilisait `new Date()` ?
- **Q4.3** `trouverOuCreer` est appelée **avant** le batch. Si le batch échoue, que reste-t-il dans la base ? Est-ce grave ?

**Faites un commit** : `git add . && git commit -m "fiche 04 - creation de recette"`.
