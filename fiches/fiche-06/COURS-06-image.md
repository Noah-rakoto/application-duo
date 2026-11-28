**SUPPORT DE COURS · FICHE 06**

# L'image d'aperçu

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Prendre ou choisir une photo, la réduire, et l'enregistrer **gratuitement** avec la recette.

---

## 1. Pourquoi pas Firebase Storage ?

Firebase Storage est le service prévu pour les fichiers. Depuis fin 2024, il **exige le forfait Blaze**, donc une carte bancaire.

Notre solution : transformer l'image en **texte** et la ranger dans un champ de la recette.

| | Firebase Storage | Notre solution |
|---|---|---|
| Prix | forfait Blaze (carte) | gratuit (Spark) |
| Où est l'image | un fichier à part | le champ `image` de la recette |
| Limite | très grande | **1 Mo par document** |

## 2. La caméra : rappel et nouveauté

Le plugin (`@capacitor/camera`, version 8) est déjà installé. Comme dans la fiche 08 du TP, pour qu'il marche dans le navigateur :

```ts
import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);          // dans main.ts
```

| Fonction | Ouvre | Renvoie |
|---|---|---|
| `Camera.takePhoto({ ... })` | l'appareil photo | `MediaResult` |
| `Camera.chooseFromGallery({ ... })` | la galerie | `{ results: MediaResult[] }` |

Le champ utile de `MediaResult` est **`webPath`** (`string | undefined`). C'est une adresse **locale**, valable seulement sur cet appareil et pendant cette session.
On ne peut donc **pas** l'enregistrer dans Firestore telle quelle : un autre téléphone ne saurait pas l'ouvrir.

Si l'utilisateur annule, ces fonctions **lèvent une erreur** : `try / catch`.

## 3. L'image en texte : le *data URL*

Une image peut s'écrire sous forme de texte, en **base64** :

```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

Ce texte s'utilise directement dans `<img :src="...">`. Le base64 est environ **33 % plus gros** que le fichier d'origine.

## 4. Réduire l'image avec un `<canvas>`

Une photo de téléphone fait 3 à 5 Mo : beaucoup trop pour un document Firestore (1 Mo).
On la redessine plus petite dans un `<canvas>`, puis on l'exporte en JPEG compressé :

```ts
async function compresser(webPath: string): Promise<string> {
  const blob = await (await fetch(webPath)).blob();      // lire l'image locale
  const bitmap = await createImageBitmap(blob);           // la décoder

  const ratio = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');        // un canvas invisible
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.6);             // JPEG qualité 60 %
}
```

| Étape | Rôle |
|---|---|
| `fetch(webPath).blob()` | récupère les octets de l'image locale |
| `createImageBitmap` | décode l'image |
| `ratio` | 800 px maximum sur le plus grand côté, sans agrandir (`Math.min(1, ...)`) |
| `drawImage` | redessine l'image à la nouvelle taille |
| `toDataURL('image/jpeg', 0.6)` | exporte en texte, qualité 60 % |

Résultat : environ **50 à 150 Ko**.

> **À RETENIR**
> | | |
> |---|---|
> | `webPath` | adresse locale : ne jamais l'enregistrer |
> | data URL | l'image en texte, utilisable dans `src` |
> | canvas | réduire avant d'enregistrer |
> | 1 Mo | taille maximale d'un document |

---

> **AU TP**
> **Fiche 06 — L'image d'aperçu** · Durée indicative : 1 h 30 · Énoncé : `fiche-06/06-image.md`
> - Service `image.ts` : caméra, galerie, compression
> - Aperçu dans le formulaire, image dans la liste et le détail
> - Q6.1 à Q6.3 · commit
