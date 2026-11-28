# Projet Recettes : les fiches

Le projet est découpé en **8 fiches**, sur le modèle des TP de Mr Rojo.
Chaque dossier `fiche-NN` contient trois fichiers :

| Fichier | Rôle |
|---|---|
| `COURS-NN-….md` | le **support de cours** : la syntaxe et les notions à connaître avant de commencer |
| `NN-….md` | la **fiche de TP** : ce qu'il faut faire, étape par étape, avec les **Vérifiez** |
| `REPONSES-NN.md` | les **questions** de la fiche, à remplir avec vos mots |

L'ordre de travail est toujours le même : **lire le cours**, puis **faire la fiche**, puis **répondre aux questions**, puis **faire un commit**.

Pour la vue d'ensemble du projet (pourquoi Firebase, pourquoi gratuit, le modèle de la base…), voir [`../EXPLICATION.md`](../EXPLICATION.md).

## Point de départ

Le dossier `recette/` contient un projet Ionic + Vue + TypeScript **vide qui fonctionne**.
Il a le même réglage que l'application de la fiche 04 du prof : Ionic 9, Vue 3.5, Capacitor 8, Camera, Preferences.

```bash
cd recette
npm install          # une seule fois (déjà fait sur le PC de Noah)
npm run dev          # ouvre http://localhost:8100, une page « Recettes » vide
```

Il n'y a **pas d'API à lancer** : la base est hébergée par Firebase.

## Les fiches

| Fiche | Contenu | Durée indicative |
|---|---|---|
| 01 | Firebase et Firestore : créer le projet, connecter l'application, lire une collection | 1 h 30 |
| 02 | Le modèle et les services : les 4 types, lire les données, remplacer les `JOIN` | 2 h |
| 03 | La liste et le détail des recettes | 2 h |
| 04 | Créer une recette : le formulaire et l'écriture en batch | 2 h |
| 05 | Éditer et supprimer une recette | 1 h 30 |
| 06 | L'image d'aperçu : caméra, galerie, compression | 1 h 30 |
| 07 | Les recherches : par libellé, par catégorie, par ingrédient | 1 h 30 |
| 08 | Sécurité (règles Firestore) et application Android | 1 h 30 |

## Le modèle de la base (rappel)

```
categories          (id, libelle)
ingredients         (id, libelle)
recettes            (id, libelle, image, id_categorie, preparation, remarque, date_creation, date_derniere_modif)
recette_ingredients (id, id_recette, id_ingredient, quantite)
```

Les fiches utilisent les deux améliorations proposées dans `EXPLICATION.md` (partie 6.2) :
- `id_mere` renommé en **`id_recette`** ;
- un champ **`quantite`** dans `recette_ingredients`.

Si vous décidez de garder `id_mere` ou de ne pas mettre de quantité, adaptez les noms dans les fiches.

## Travailler à deux

- Un commit à la fin de chaque fiche, avec le message indiqué en bas de la fiche.
- `git pull` avant de commencer, `git push` après le commit.
- Les fiches 01 et 02 se font **ensemble** : tout le reste en dépend.
- Ensuite, vous pouvez vous partager le travail :
  - fiches 03 et 07 (lecture, recherches) d'un côté ;
  - fiches 04, 05 et 06 (formulaire, image) de l'autre.
