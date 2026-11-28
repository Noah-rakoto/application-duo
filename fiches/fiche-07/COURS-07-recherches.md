**SUPPORT DE COURS · FICHE 07**

# Les recherches

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Rechercher les recettes par libellé, par catégorie et par ingrédient, en choisissant pour chaque recherche **où** filtrer : dans Firestore ou dans l'application.

---

## 1. Deux endroits pour filtrer

| Où | Comment | Quand l'utiliser |
|---|---|---|
| **Firestore** | `query(..., where(...))` | égalité exacte sur un champ ; seuls les documents utiles sont téléchargés |
| **Application** | `computed` + `filter` | ce que Firestore ne sait pas faire (recherche dans un texte) ; données déjà chargées |

## 2. Ce que Firestore sait faire (et pas)

```ts
where('id_categorie', '==', id)          // égalité
where('id_recette', 'in', [id1, id2])    // dans une liste (30 valeurs maximum)
where(documentId(), 'in', [id1, id2])    // par ID de document
```

Firestore **ne sait pas** :
- chercher un mot **à l'intérieur** d'un texte (pas de `LIKE '%riz%'`) ;
- ignorer les majuscules ou les accents ;
- faire un `JOIN`.

⚠️ Un `where` sur un champ + un `orderBy` sur **un autre** champ demande un **index composite**.
Firestore renvoie alors une erreur avec un **lien** pour le créer dans la console. On peut aussi trier dans l'application, comme en fiche 02.

## 3. Recherche dans un texte (côté application)

Même technique que la barre de recherche de `MenuPage.vue` du TP :

```ts
const recherche = ref('');

const recettesFiltrees = computed(() => {
  const texte = normaliser(recherche.value);
  return recettes.value.filter(r => normaliser(r.libelle).includes(texte));
});
```

Pour ignorer les majuscules **et** les accents (« creme » trouve « Crème ») :

```ts
function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
```

`normalize('NFD')` sépare « è » en « e » + accent, et le `replace` retire les accents.

## 4. Recherche par ingrédient : à travers la table de liaison

L'information « cette recette contient du riz » est dans `recette_ingredients`, pas dans `recettes`.

```
1. ingredients            → l'utilisateur choisit « riz » (id i91K)
2. recette_ingredients    → where('id_ingredient', '==', 'i91K')  →  id_recette : aB3x, Zt7p
3. recettes déjà chargées → on garde celles dont l'id est dans { aB3x, Zt7p }
```

Pour tester rapidement « cet ID est-il dans la liste ? », on utilise un **`Set`** :

```ts
const ids = new Set(liens.docs.map(d => d.data().id_recette as string));
ids.has('aB3x');   // true
```

## 5. Combiner plusieurs filtres

Chaque filtre réduit le résultat du précédent. On les enchaîne dans **un seul** `computed` :

```ts
const recettesFiltrees = computed(() =>
  recettes.value
    .filter(r => /* filtre texte */)
    .filter(r => idsIngredient.value === null || idsIngredient.value.has(r.id))
);
```

`null` veut dire « pas de filtre » : toutes les recettes passent.

## 6. `ion-select` avec un choix « Tous »

```html
<ion-select v-model="idIngredient" label="Ingrédient" interface="action-sheet">
  <ion-select-option :value="null">Tous</ion-select-option>
  <ion-select-option v-for="i in ingredients" :key="i.id" :value="i.id">{{ i.libelle }}</ion-select-option>
</ion-select>
```

`@ion-change` déclenche une fonction quand le choix change, comme le segment des catégories du TP.

> **À RETENIR**
> | | |
> |---|---|
> | `where` | égalité exacte, côté serveur |
> | `computed` + `filter` | texte, accents, majuscules |
> | `Set` | « est-ce que cet ID en fait partie ? » |
> | `null` | « pas de filtre » |

---

> **AU TP**
> **Fiche 07 — Les recherches** · Durée indicative : 1 h 30 · Énoncé : `fiche-07/07-recherches.md`
> - Par libellé, sans accents
> - Par catégorie, avec `where`
> - Par ingrédient, à travers `recette_ingredients`
> - Q7.1 à Q7.3 · commit
