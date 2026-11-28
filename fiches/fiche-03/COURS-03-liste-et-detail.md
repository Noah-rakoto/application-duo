**SUPPORT DE COURS · FICHE 03**

# La liste et le détail

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Construire les deux pages de lecture : la liste des recettes et le détail d'une recette, avec la navigation entre les deux.

---

## 1. Les routes et leur ordre

```ts
children: [
  { path: '', redirect: '/tabs/recettes' },
  { path: 'recettes',              component: () => import('@/views/RecettesPage.vue') },
  { path: 'recettes/nouvelle',     component: () => import('@/views/RecetteFormPage.vue') },
  { path: 'recettes/:id',          component: () => import('@/views/RecetteDetailPage.vue') },
  { path: 'recettes/:id/modifier', component: () => import('@/views/RecetteFormPage.vue') },
]
```

Le routeur essaie les routes **dans l'ordre**. Si `recettes/:id` passait avant `recettes/nouvelle`, l'adresse `/tabs/recettes/nouvelle` ouvrirait le détail avec `id = "nouvelle"`.

On lit le paramètre avec `useRoute()`, comme dans `PlatDetailPage.vue` du TP. **Les ID Firestore sont des chaînes** : plus de `Number(...)`.

```ts
const id = String(useRoute().params.id);
```

## 2. Quand charger ? (rappel du TP, fiche 02)

| Hook | S'exécute | Usage ici |
|---|---|---|
| `onMounted` | **une fois**, à la création de la page | les catégories (elles changent rarement) |
| `onIonViewWillEnter` | **à chaque** arrivée sur la page | les recettes (on revient du formulaire après un ajout) |

Ionic garde les pages en mémoire : `onMounted` ne se relance pas quand on revient sur la liste.

## 3. Retrouver la catégorie d'une recette

Une recette ne contient que `id_categorie`. Pour afficher « Plat », on cherche la catégorie dans une `Map` (cours 02) :

```ts
const categoriesParId = computed(() => new Map(categories.value.map(c => [c.id, c])));

function libelleCategorie(r: Recette): string {
  return categoriesParId.value.get(r.id_categorie)?.libelle ?? 'Sans catégorie';
}
```

`?.` et `??` gèrent le cas où la catégorie n'existe plus.

## 4. Composants utiles

```html
<!-- Image à gauche d'un élément de liste -->
<ion-item>
  <ion-thumbnail slot="start">
    <img v-if="r.image" :src="r.image" alt="" />
  </ion-thumbnail>
  <ion-label>...</ion-label>
</ion-item>

<!-- Bouton rond flottant, en bas à droite -->
<ion-fab slot="fixed" vertical="bottom" horizontal="end">
  <ion-fab-button router-link="/tabs/recettes/nouvelle">
    <ion-icon :icon="add" />
  </ion-fab-button>
</ion-fab>

<!-- Retour vers la liste -->
<ion-buttons slot="start">
  <ion-back-button default-href="/tabs/recettes" />
</ion-buttons>
```

## 5. Afficher un texte sur plusieurs lignes

La préparation est un texte saisi avec des retours à la ligne. Par défaut, HTML les **ignore**. La propriété CSS `white-space` les conserve :

```html
<p class="texte-long">{{ recette.preparation }}</p>
```
```css
.texte-long { white-space: pre-line; }
```

## 6. Les dates Firestore

```ts
import type { Timestamp } from 'firebase/firestore';

export function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
```

| Méthode | Résultat |
|---|---|
| `ts.toDate()` | un objet `Date` JavaScript |
| `ts.toMillis()` | un nombre (pratique pour trier) |

> **À RETENIR**
> | | |
> |---|---|
> | Ordre des routes | `nouvelle` avant `:id` |
> | `onIonViewWillEnter` | recharger à chaque retour sur la liste |
> | `Map` + `?.` + `??` | afficher la catégorie sans planter |
> | `white-space: pre-line` | garder les retours à la ligne |

---

> **AU TP**
> **Fiche 03 — La liste et le détail** · Durée indicative : 2 h · Énoncé : `fiche-03/03-liste-et-detail.md`
> - Routeur, onglets
> - Page Liste : 4 états, refresher, bouton +
> - Page Détail : sections Ingrédients, Préparation, Remarque
> - Q3.1 à Q3.3 · commit
