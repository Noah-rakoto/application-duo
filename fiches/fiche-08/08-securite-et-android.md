# Fiche 08 — Sécurité et Android

**Durée** : 1 h 30 · **Cours** : `COURS-08-securite-et-android.md`

## Objectif

Protéger la base avec de vraies règles de sécurité, puis installer l'application sur un téléphone.

## 1. Écrire les règles

Copiez la base du cours (partie 2) dans un fichier **`recette/firestore.rules`**, pour qu'elle soit versionnée avec Git.
Complétez-la pour les 4 collections, puis collez-la dans la console et **publiez**.

| Collection | read | create / update | delete |
|---|---|---|---|
| `categories` | oui | `libelle` texte non vide, aucun autre champ | non (les catégories sont gérées dans la console) |
| `ingredients` | oui | `libelle` texte non vide **et en minuscules** (`v == v.lower()`), aucun autre champ | oui |
| `recettes` | oui | voir ci-dessous | oui |
| `recette_ingredients` | oui | `id_recette` et `id_ingredient` textes non vides, `quantite` texte, aucun autre champ | oui |

Pour **`recettes`** :
- exactement les champs `libelle`, `image`, `id_categorie`, `preparation`, `remarque`, `date_creation`, `date_derniere_modif` ;
- `libelle` et `preparation` : textes non vides ; `remarque` : texte (peut être vide) ; `id_categorie` : texte non vide ;
- `image` : `null`, **ou** un texte de moins de 900 000 caractères ;
- à la création : les deux dates valent `request.time` ;
- à l'édition : `date_creation` est inchangée, `date_derniere_modif` vaut `request.time`.

Utilisez des `function` pour ne pas répéter les conditions communes à `create` et `update`.

## 2. Tester

Dans le **terrain de jeu des règles** de la console :

- une lecture de `recettes/xxx` : autorisée ;
- une création dans `categories` avec `{ "libelle": "" }` : refusée ;
- une création dans `ingredients` avec `{ "libelle": "Riz" }` : refusée (majuscule).

Dans l'application :

- créez, éditez et supprimez une recette avec une image : **tout doit encore marcher** ;
- dans `creerRecette`, ajoutez temporairement un champ `pirate: true` : l'enregistrement doit échouer avec
  `permission-denied` et votre toast rouge. Notez le message exact, puis retirez le champ.

## 3. Sur un vrai téléphone Android

Suivez le cours, partie 5. Puis, sur le téléphone :

- la liste s'affiche (le téléphone est sur internet, **pas** forcément sur le même Wi-Fi que le PC) ;
- prenez une **vraie** photo avec l'appareil photo, et choisissez une image dans la galerie ;
- créez une recette sur le téléphone : elle apparaît sur le PC (`npm run dev`) après un rafraîchissement.

## 4. Bonus — Chacun ses recettes

Le sujet dit « les recettes **créées par l'utilisateur** ». Avec **Firebase Authentication** (gratuit) :

1. activez la connexion **Adresse e-mail / mot de passe** dans la console ;
2. ajoutez un champ `id_utilisateur` aux recettes ;
3. dans les règles, `request.auth.uid` donne l'utilisateur connecté : n'autorisez la lecture et l'écriture d'une recette qu'à son auteur.

## Questions

- **Q8.1** Le formulaire vérifie déjà les champs (fiche 04). Pourquoi les règles doivent-elles **aussi** les vérifier ? Donnez un moyen concret de contourner le formulaire.
- **Q8.2** Dans la fiche 08 du TP, il fallait mettre l'IP du PC dans `.env` pour le téléphone. Pourquoi plus maintenant ?
- **Q8.3** Quel message exact avez-vous obtenu avec le champ `pirate` ? Que serait-il arrivé à l'application le 31ᵉ jour si vous étiez restés en mode test ?

**Faites un commit** : `git add . && git commit -m "fiche 08 - regles et android"`. C'est la version à rendre.
