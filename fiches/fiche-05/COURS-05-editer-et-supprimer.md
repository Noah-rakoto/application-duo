**SUPPORT DE COURS · FICHE 05**

# Éditer et supprimer

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Réutiliser le formulaire pour éditer une recette, et supprimer une recette **avec tout ce qui en dépend**.

---

## 1. Une page, deux modes

La même page sert à créer et à éditer. Elle choisit son mode d'après l'adresse :

| Adresse | `params.id` | Mode |
|---|---|---|
| `/tabs/recettes/nouvelle` | `undefined` | création |
| `/tabs/recettes/aB3x/modifier` | `"aB3x"` | édition |

```ts
const route = useRoute();
const idRecette = route.params.id ? String(route.params.id) : null;
const enEdition = idRecette !== null;
```

En édition, on charge la recette au montage et on **pré-remplit** chaque `ref` du formulaire.
Les lignes d'ingrédients se reconstruisent à partir de `RecetteDetail.lignes` :

```ts
lignes.value = detail.lignes.map(l => ({ libelle: l.ingredient.libelle, quantite: l.quantite }));
```

## 2. Modifier un document

```ts
import { updateDoc, doc } from 'firebase/firestore';

await updateDoc(doc(db, 'recettes', id), { libelle: 'Romazava', date_derniere_modif: serverTimestamp() });
```

| Fonction | Effet sur les champs **non envoyés** |
|---|---|
| `updateDoc(ref, champs)` / `batch.update(...)` | **conservés** (seuls les champs envoyés changent) |
| `setDoc(ref, données)` / `batch.set(...)` | **effacés** (le document est remplacé) |

Pour éditer, on utilise donc `update`, et on n'envoie **pas** `date_creation`.

## 3. Pas de suppression en cascade

En SQL, `ON DELETE CASCADE` supprime les lignes liées. Firestore ne le fait pas :
supprimer une recette laisse ses `recette_ingredients` **orphelins**.
Il faut les chercher puis les supprimer nous-mêmes, **dans le même batch** :

```ts
const liens = await getDocs(query(collection(db, 'recette_ingredients'), where('id_recette', '==', id)));

const batch = writeBatch(db);
liens.docs.forEach(d => batch.delete(d.ref));     // d.ref : la référence du document lu
batch.delete(doc(db, 'recettes', id));
await batch.commit();
```

## 4. Éditer les ingrédients : supprimer puis recréer

Calculer quelles lignes ont été ajoutées, retirées ou modifiées est compliqué.
Plus simple : dans un même batch, **supprimer tous les anciens liens** puis **recréer** ceux du formulaire.

## 5. Confirmer une suppression

```ts
const alerte = await alertController.create({
  header: 'Supprimer la recette ?',
  message: 'Cette action est définitive.',
  buttons: [
    { text: 'Annuler', role: 'cancel' },
    { text: 'Supprimer', role: 'destructive' },
  ],
});
await alerte.present();
const { role } = await alerte.onDidDismiss();
if (role === 'destructive') { /* supprimer */ }
```

Le rôle `destructive` affiche le bouton en rouge sur iOS.

> **À RETENIR**
> | | |
> |---|---|
> | `params.id` présent ? | création ou édition |
> | `update` | ne touche que les champs envoyés |
> | Pas de cascade | supprimer les liens à la main, dans le batch |
> | `d.ref` | la référence d'un document lu |

---

> **AU TP**
> **Fiche 05 — Éditer et supprimer** · Durée indicative : 1 h 30 · Énoncé : `fiche-05/05-editer-et-supprimer.md`
> - Le formulaire en mode édition
> - `modifierRecette` et `supprimerRecette` en batch
> - Boutons Éditer et Supprimer dans le détail
> - Q5.1 à Q5.3 · commit
