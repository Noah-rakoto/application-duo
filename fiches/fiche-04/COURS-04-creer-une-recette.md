**SUPPORT DE COURS · FICHE 04**

# Créer une recette

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Construire un formulaire complet (avec une liste d'ingrédients de taille variable), le valider, puis enregistrer **plusieurs documents liés en une seule opération**.

---

## 1. Les champs de formulaire Ionic

Tous s'utilisent avec `v-model` et affichent une erreur avec `error-text` + les classes `ion-invalid ion-touched` (fiche 04 du TP).

```html
<ion-input v-model="libelle" label="Libellé" label-placement="floating" fill="outline"
           :class="{ 'ion-invalid ion-touched': erreurs.libelle }" :error-text="erreurs.libelle" />

<ion-select v-model="idCategorie" label="Catégorie" label-placement="floating" fill="outline">
  <ion-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.libelle }}</ion-select-option>
</ion-select>

<ion-textarea v-model="preparation" label="Préparation" label-placement="floating"
              fill="outline" :auto-grow="true" :rows="5" />
```

| Composant | Pour |
|---|---|
| `ion-input` | une ligne de texte |
| `ion-select` + `ion-select-option` | choisir dans une liste (`:value` = ce qui va dans `v-model`) |
| `ion-textarea` | un texte long ; `auto-grow` agrandit le champ en tapant |

`ion-select` n'a pas d'`error-text` : affichez l'erreur dessous avec un `ion-note color="danger"`.

## 2. Une liste de lignes de taille variable

La section Ingrédients du formulaire est un **tableau de lignes** que l'utilisateur agrandit ou réduit :

```ts
interface LigneFormulaire { libelle: string; quantite: string }

const lignes = ref<LigneFormulaire[]>([{ libelle: '', quantite: '' }]);

function ajouterLigne() { lignes.value.push({ libelle: '', quantite: '' }); }
function retirerLigne(index: number) { lignes.value.splice(index, 1); }
```
```html
<ion-item v-for="(ligne, index) in lignes" :key="index">
  <ion-input v-model="ligne.quantite" placeholder="500 g" />
  <ion-input v-model="ligne.libelle" placeholder="ingrédient" />
  <ion-button fill="clear" color="danger" @click="retirerLigne(index)">
    <ion-icon slot="icon-only" :icon="trashOutline" />
  </ion-button>
</ion-item>
<ion-button fill="outline" @click="ajouterLigne">+ Ajouter un ingrédient</ion-button>
```

Ce tableau n'existe **que dans le formulaire**. Dans la base, chaque ligne devient un vrai ingrédient (`ingredients`) et un vrai lien (`recette_ingredients`).

## 3. Valider avant d'envoyer

On regroupe les messages d'erreur dans un objet, vidé à chaque tentative :

```ts
const erreurs = ref<Record<string, string>>({});

function valider(): boolean {
  erreurs.value = {};
  if (libelle.value.trim() === '') erreurs.value.libelle = 'Le libellé est obligatoire';
  // ... les autres règles
  return Object.keys(erreurs.value).length === 0;
}
```

## 4. Écrire plusieurs documents d'un coup : `writeBatch`

Une recette = **1 document `recettes` + N documents `recette_ingredients`**. Si l'application s'arrête au milieu, la base devient incohérente.
Un **batch** regroupe les écritures : **toutes réussissent, ou aucune**. C'est l'équivalent d'une transaction SQL.

```ts
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';

const batch = writeBatch(db);

// doc(collection(...)) fabrique une référence avec un NOUVEL ID, sans rien écrire
const recetteRef = doc(collection(db, 'recettes'));
recetteRef.id;                          // déjà connu : utilisable dans les liens

batch.set(recetteRef, { libelle: 'Romazava', /* ... */ });
batch.set(doc(collection(db, 'recette_ingredients')), { id_recette: recetteRef.id, /* ... */ });

await batch.commit();                   // tout est envoyé ici, en une fois
```

| Méthode | Rôle |
|---|---|
| `writeBatch(db)` | commence un batch |
| `batch.set(ref, données)` | prévoit une création (ou un remplacement) |
| `batch.update(ref, champs)` | prévoit une modification (fiche 05) |
| `batch.delete(ref)` | prévoit une suppression (fiche 05) |
| `batch.commit()` | envoie tout ; **rien n'est écrit avant** |

## 5. L'heure du serveur : `serverTimestamp()`

```ts
batch.set(recetteRef, {
  // ...
  date_creation: serverTimestamp(),
  date_derniere_modif: serverTimestamp(),
});
```

`serverTimestamp()` est remplacé par l'heure **des serveurs Google** au moment de l'écriture.
`new Date()` prendrait l'heure du téléphone, qui peut être fausse.

> **À RETENIR**
> | | |
> |---|---|
> | Tableau de lignes | `push` pour ajouter, `splice` pour retirer |
> | `erreurs` | un objet : un message par champ |
> | `writeBatch` | tout ou rien |
> | `doc(collection(...))` | connaître l'ID avant d'écrire |
> | `serverTimestamp()` | l'heure du serveur, pas du téléphone |

---

> **AU TP**
> **Fiche 04 — Créer une recette** · Durée indicative : 2 h · Énoncé : `fiche-04/04-creer-une-recette.md`
> - Le formulaire : libellé, catégorie, ingrédients, préparation, remarque
> - La validation
> - `creerRecette` avec un batch
> - Q4.1 à Q4.3 · commit
