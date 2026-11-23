**SUPPORT DE COURS · FICHE 01**

# Firebase et Firestore

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Comprendre ce qui remplace l'API Express des TP, et lire une première collection Firestore depuis l'application.

---

## 1. Plus de serveur à lancer

Dans les TP, les données venaient d'une API que l'on lançait soi-même (`npm start` dans `api/`).
Avec Firebase, la base est **hébergée par Google**. L'application lui parle directement, grâce à la bibliothèque `firebase` (le « SDK »).

```
TP Gargote :   App  →  services/api.ts  →  fetch()   →  API Express (votre PC)
Projet     :   App  →  services/*.ts     →  SDK Firebase  →  Firestore (Google)
                                                               ↑ règles de sécurité
```

La règle d'architecture ne change pas : **les pages n'appellent jamais Firebase directement**. Tout passe par les fichiers `services/`.

> **À RETENIR**
> | | |
> |---|---|
> | Plus d'API | rien à lancer à part `npm run dev` |
> | SDK Firebase | `npm install firebase`, appelé seulement depuis `services/` |
> | Règles de sécurité | remplacent les vérifications que faisait l'API (fiche 08) |

## 2. Gratuit : le forfait Spark

| Forfait | Carte bancaire | Pour nous |
|---|---|---|
| **Spark** | non | ✅ Firestore gratuit : ≈ 1 Go, 50 000 lectures et 20 000 écritures par jour |
| Blaze | oui | ❌ obligatoire pour Firebase Storage, qu'on **n'utilise pas** (fiche 06) |

## 3. Le vocabulaire Firestore

Firestore n'est pas une base SQL, mais on peut faire le parallèle :

| SQL | Firestore |
|---|---|
| table | **collection** |
| ligne | **document** |
| colonne | **champ** |
| clé primaire | **ID du document** : une chaîne générée par Firebase, ex. `"c7HqP2..."` |

L'ID **ne fait pas partie des données** du document. On le lit à part, avec `d.id`.

## 4. Se connecter : `firebase.ts`

La configuration du projet se lit dans `.env`, comme `VITE_API_URL` dans les TP.
Seules les variables qui commencent par `VITE_` sont visibles dans l'application.

```ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... les autres valeurs de .env
});

export const db = getFirestore(app);   // la base, utilisée par tous les services
```

Pour que TypeScript connaisse ces variables, on les déclare dans `src/env.d.ts` :

```ts
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  // ...
}
```

⚠️ Vite ne lit `.env` **qu'au démarrage** : après une modification, il faut relancer `npm run dev`.

## 5. Lire une collection

```ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const resultat = await getDocs(collection(db, 'categories'));

resultat.docs.forEach(d => {
  console.log(d.id);       // "c7HqP2..."         : l'ID du document
  console.log(d.data());   // { libelle: "Plat" } : les champs
});
```

| Fonction | Rôle |
|---|---|
| `collection(db, 'nom')` | désigne une collection (ne lit rien) |
| `getDocs(...)` | lit **tous** les documents de la collection (asynchrone) |
| `resultat.docs` | le tableau des documents lus |
| `d.id` / `d.data()` | l'ID / les champs d'un document |

`getDocs` renvoie une `Promise` : on l'utilise avec `await` dans un `try / catch`, exactement comme `api.getPlats()` dans les TP.

> **À RETENIR**
> | | |
> |---|---|
> | `collection()` | désigne, ne lit pas |
> | `getDocs()` | lit, renvoie une Promise |
> | `d.id` + `d.data()` | l'ID est à part des champs |

---

> **AU TP**
> **Fiche 01 — Firebase et Firestore** · Durée indicative : 1 h 30 · Énoncé : `fiche-01/01-firebase.md`
> - Créer le projet Firebase et la base Firestore
> - Créer la collection `categories` à la main
> - `.env`, `env.d.ts`, `firebase.ts`
> - Afficher les catégories dans la page d'accueil · Q1.1 à Q1.3 · commit
