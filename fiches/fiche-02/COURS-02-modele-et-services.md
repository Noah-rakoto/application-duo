**SUPPORT DE COURS · FICHE 02**

# Le modèle et les services

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Traduire notre modèle relationnel en collections Firestore, le décrire avec des types TypeScript, et lire des données liées **sans `JOIN`**.

---

## 1. Un modèle relationnel dans Firestore

On garde nos 4 tables. Chacune devient une collection, et les clés étrangères deviennent des champs qui contiennent **l'ID d'un autre document**.

```
categories ◄──── recettes.id_categorie
recettes   ◄──── recette_ingredients.id_recette
ingredients ◄─── recette_ingredients.id_ingredient
```

| Collection | Champs |
|---|---|
| `categories` | `libelle` |
| `ingredients` | `libelle` (en minuscules) |
| `recettes` | `libelle`, `image`, `id_categorie`, `preparation`, `remarque`, `date_creation`, `date_derniere_modif` |
| `recette_ingredients` | `id_recette`, `id_ingredient`, `quantite` |

Firestore ne vérifie **rien** de tout ça : il accepte un `id_categorie` qui ne pointe vers aucune catégorie.
C'est à notre code (et plus tard aux règles, fiche 08) de garder la base cohérente.

## 2. Les types : un par collection

Comme `types/gargote.ts` dans les TP, chaque collection a son interface. L'`id` y figure, même s'il n'est pas dans les champs du document : c'est le service qui l'ajoute.

```ts
import type { Timestamp } from 'firebase/firestore';

export interface Categorie {
  id: string;
  libelle: string;
}
```

Les dates Firestore ont leur propre type : **`Timestamp`**. On le convertit en `Date` JavaScript avec `.toDate()`.

Les types « composés » servent à l'affichage. Exemple : une ligne de la section Ingrédients, c'est un ingrédient **et** sa quantité.

```ts
export interface LigneIngredient {
  ingredient: Ingredient;
  quantite: string;
}
```

## 3. Du document au type

`d.data()` renvoie un objet sans type précis (`DocumentData`). On assemble l'objet typé dans **une petite fonction**, utilisée partout dans le service :

```ts
import type { QueryDocumentSnapshot } from 'firebase/firestore';

function versCategorie(d: QueryDocumentSnapshot): Categorie {
  return { id: d.id, libelle: d.data().libelle };
}

const resultat = await getDocs(collection(db, 'categories'));
return resultat.docs.map(versCategorie);
```

Écrire `d.data() as Categorie` compilerait aussi, mais **`as` n'est pas une vérification** (fiche 08 du TP, Q8.2). Le moins risqué, c'est de lire chaque champ.

## 4. Lire avec un filtre : `query` et `where`

```ts
import { query, where, getDocs, getDoc, doc } from 'firebase/firestore';

// SELECT * FROM recette_ingredients WHERE id_recette = 'aB3x'
const q = query(collection(db, 'recette_ingredients'), where('id_recette', '==', 'aB3x'));
const resultat = await getDocs(q);

// SELECT * FROM recettes WHERE id = 'aB3x'  (un seul document, par son ID)
const d = await getDoc(doc(db, 'recettes', 'aB3x'));
if (!d.exists()) { /* la recette n'existe pas */ }
```

| Fonction | Équivalent SQL |
|---|---|
| `getDocs(collection(...))` | `SELECT * FROM ...` |
| `getDocs(query(..., where('champ', '==', v)))` | `... WHERE champ = v` |
| `getDoc(doc(db, 'coll', id))` | `... WHERE id = ...` (un seul) |
| `d.exists()` | la ligne a-t-elle été trouvée ? |

## 5. Remplacer le `JOIN`

Pas de `JOIN` : on lit chaque collection, puis on **assemble dans le code**.
Pour retrouver vite un élément par son ID, on construit une **`Map`** :

```ts
const ingredients = await getIngredients();                   // tous, une seule lecture
const parId = new Map(ingredients.map(i => [i.id, i]));       // id -> Ingredient

const ingredient = parId.get('i91K');                         // Ingredient | undefined
```

Plusieurs lectures indépendantes ? On les lance **en même temps** avec `Promise.all`, comme dans `main.ts` des TP :

```ts
const [recette, liens] = await Promise.all([lireRecette(id), lireLiens(id)]);
```

> **À RETENIR**
> | | |
> |---|---|
> | Clé étrangère | un champ qui contient un ID |
> | Pas de JOIN | plusieurs lectures + assemblage dans le code |
> | `Map` | retrouver un objet par son ID |
> | `Promise.all` | lancer des lectures en parallèle |

## 6. Créer un document

```ts
import { addDoc } from 'firebase/firestore';

const ref = await addDoc(collection(db, 'ingredients'), { libelle: 'riz' });
ref.id;   // l'ID généré par Firestore
```

---

> **AU TP**
> **Fiche 02 — Le modèle et les services** · Durée indicative : 2 h · Énoncé : `fiche-02/02-modele-et-services.md`
> - Les types dans `types/recette.ts`
> - Des données de test à la main
> - Services `categories.ts`, `ingredients.ts`, `recettes.ts` (lecture)
> - Q2.1 à Q2.3 · commit
