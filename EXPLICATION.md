# Projet Recettes : ce qu'on va faire et comment

Ce document explique la démarche du projet, étape par étape.
Il ne contient pas le code de l'application : c'est à nous de l'écrire.

---

## 1. Ce que le prof demande

| Exigence du sujet | Ce que ça veut dire chez nous |
|---|---|
| Une liste de notre choix | La liste des **recettes de cuisine** |
| Un formulaire CRUD | **C**réer, **R**elire, modifier (**U**pdate) et supprimer (**D**elete) une recette |
| L'upload d'image | Ajouter une **photo** à une recette (appareil photo ou galerie) |
| Firebase | Les recettes sont enregistrées dans **Firebase**, pas dans une API locale |

Nos fonctionnalités en plus :
- créer nos propres recettes ;
- filtrer les recettes **par aliment / ingrédient** ;
- les autres idées restent à décider (favoris, temps de préparation, nombre de personnes…).

---

## 2. Rappel : comment marchait l'application de la fiche 04

La fiche 04 (application « Gargote ») avait cette architecture :

```
App Ionic + Vue  →  services/api.ts  →  fetch()  →  API Express (dossier api/, npm start)  →  données
```

Ce qu'il faut retenir de la fiche 04 :
- **Ionic + Vue 3 + TypeScript**, avec **Capacitor** pour Android ;
- des **pages** (`views/`) reliées par un **routeur** et des **onglets** (`TabsPage`) ;
- **un seul fichier** (`services/api.ts`) qui parle au serveur. Les pages ne font jamais `fetch()` elles-mêmes ;
- des **types** TypeScript (`types/gargote.ts`) qui décrivent les données ;
- des **composables** (`usePanier`, `useFavoris`) pour partager un état entre les pages ;
- **Preferences** (`services/stockage.ts`) pour garder des données sur le téléphone ;
- **Camera** pour prendre une photo ;
- dans chaque page, les états **chargement / erreur / liste vide / liste**, le *pull-to-refresh*, les toasts et les alertes.

**On garde toute cette organisation.** La seule grosse différence, c'est **d'où viennent les données**.

---

## 3. Ce qui change avec Firebase

```
App Ionic + Vue  →  services/recettes.ts  →  SDK Firebase  →  internet  →  Firestore (serveurs Google)
                                                                              ↑
                                                       les règles de sécurité vérifient chaque requête
```

- **Il n'y a plus de serveur `api/` à lancer.** La base de données est hébergée par Google.
- On installe la bibliothèque `firebase` (`npm install firebase`) et on l'appelle depuis **un seul fichier service**, comme `api.ts` dans la fiche 04.
- Le téléphone doit avoir **internet** (plus besoin d'être sur le même Wi-Fi que le PC).

### Correspondance API Express → Firestore

| Fiche 04 (API) | Firestore | Rôle |
|---|---|---|
| `GET /plats` | `getDocs(...)` | lire toute la liste |
| `GET /plats?categorie=2` | `getDocs(query(..., where(...)))` | lire une liste filtrée |
| `GET /plats/:id` | `getDoc(...)` | lire un élément |
| `POST /plats` | `addDoc(...)` | créer |
| `PUT /plats/:id` | `updateDoc(...)` | modifier |
| `DELETE /plats/:id` | `deleteDoc(...)` | supprimer |

### Vocabulaire Firestore

- **Collection** : l'équivalent d'une table. Chez nous, il y en a une seule : `recettes`.
- **Document** : l'équivalent d'une ligne, ici une recette. Il contient des champs (nom, ingrédients…).
- **ID** : chaque document a un identifiant généré par Firebase, du type `"aB3xK9..."`.
  ⚠️ C'est une **chaîne de caractères**, pas un nombre comme dans la fiche 04 (`id: string`).

---

## 4. Est-ce qu'on doit payer ? Non

Firebase a deux forfaits :

| Forfait | Prix | Carte bancaire | Ce qu'il contient |
|---|---|---|---|
| **Spark** | gratuit | **non** | Firestore (≈ 1 Go, 50 000 lectures et 20 000 écritures par jour), Authentication, Hosting |
| **Blaze** | paiement à l'usage | **oui** | tout, y compris **Firebase Storage** (le stockage de fichiers) |

👉 On reste sur **Spark**. On ne met **jamais** de carte bancaire.

### Le piège : l'upload d'image

Le service normal pour stocker des images s'appelle **Firebase Storage**.
Depuis fin 2024, il **exige le forfait Blaze**, donc une carte bancaire. On ne l'utilise pas.

**Notre solution gratuite : stocker l'image directement dans Firestore, sous forme de texte.**

1. On prend une photo avec Capacitor Camera (comme dans la fiche 04).
2. On la **réduit** : environ 800 px maximum, JPEG en qualité 60 %. Pour ça, on la dessine dans un `<canvas>` HTML.
3. Le canvas nous donne une chaîne `"data:image/jpeg;base64,/9j/4AAQ..."` d'environ 50 à 150 Ko.
4. On enregistre cette chaîne dans un champ `image` de la recette.
5. Pour l'afficher : `<img :src="recette.image">`. Ça marche directement.

⚠️ Un document Firestore ne peut pas dépasser **1 Mo**. C'est pour ça qu'il faut **toujours réduire la photo** avant de l'enregistrer.
Une photo brute de téléphone fait 3 à 5 Mo : elle serait refusée.

Autre solution possible (non retenue) : un service d'images gratuit comme Cloudinary.
Elle marche, mais c'est un compte et un outil de plus à apprendre.

---

## 5. Mise en place de Firebase (dans le navigateur)

À faire **une seule fois**, par l'un de nous deux, puis partager l'accès à l'autre.

1. Aller sur **console.firebase.google.com** et se connecter avec un compte Google.
2. **Créer un projet** (par exemple « recettes-duo »). Google Analytics n'est pas nécessaire.
3. Dans le menu : **Build → Firestore Database → Créer une base de données**.
   - Région : une région européenne (par exemple `europe-west1`).
   - Choisir le **mode test** pour commencer (tout le monde peut lire et écrire).
   - ⚠️ Le mode test **expire au bout de 30 jours**. Après, il faut écrire de vraies règles (voir la partie 9).
4. Dans **Paramètres du projet** (roue dentée) → **Vos applications** → icône **Web `</>`**, enregistrer une application.
   Firebase affiche un objet `firebaseConfig` : `apiKey`, `authDomain`, `projectId`, `appId`…
5. Copier ces valeurs dans un fichier **`.env`** à la racine de `recette/` (comme `VITE_API_URL` dans la fiche 04) :
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
   - Ces clés ne sont pas vraiment secrètes : elles finissent dans l'APK. Ce sont les **règles de sécurité** qui protègent la base.
   - On peut quand même mettre `.env` dans `.gitignore` et s'envoyer le fichier entre nous.
6. **Partager le projet** avec le binôme : Paramètres du projet → Utilisateurs et autorisations → ajouter son adresse Gmail.
7. On ne passe **pas** au forfait Blaze, même si la console le propose.

---

## 6. Les données : à quoi ressemble une recette

À décider **ensemble au tout début**, car tout le reste en dépend. Une proposition :

| Champ | Type TypeScript | Exemple |
|---|---|---|
| `id` | `string` | `"aB3xK9..."` (donné par Firestore) |
| `nom` | `string` | `"Romazava"` |
| `description` | `string` | `"Plat traditionnel malgache"` |
| `categorie` | `string` | `"Plat"` (Entrée, Plat, Dessert, Boisson…) |
| `ingredients` | `string[]` | `["zébu", "brèdes", "gingembre"]` |
| `etapes` | `string[]` | `["Couper la viande", "Faire revenir..."]` |
| `tempsMinutes` | `number` | `45` |
| `personnes` | `number` | `4` |
| `image` | `string \| null` | `"data:image/jpeg;base64,..."` ou `null` |
| `creeLe` | `number` | `Date.now()`, pour trier par date |

Conseils :
- enregistrer les **ingrédients en minuscules** : le filtre « par aliment » sera plus simple (`"Riz"` et `"riz"` deviennent la même chose) ;
- `ingredients` est un **tableau** : Firestore sait chercher dedans avec `where('ingredients', 'array-contains', 'riz')`.

---

## 7. Les pages de l'application

```
Onglets (TabsPage)
├── Recettes   /tabs/recettes              → liste + recherche + filtres
│     ├── Détail     /tabs/recettes/:id            → voir, Modifier, Supprimer
│     ├── Nouvelle   /tabs/recettes/nouvelle       → formulaire vide
│     └── Modifier   /tabs/recettes/:id/modifier   → même formulaire, pré-rempli
└── Favoris    /tabs/favoris               → (optionnel) recettes en favori
```

| Page | Ce qu'elle fait | Équivalent fiche 04 |
|---|---|---|
| **Liste** | affiche les recettes (photo, nom, temps), une barre de recherche, un filtre par catégorie (segment) et un **filtre par ingrédient**, un bouton « + » pour créer | `MenuPage` |
| **Détail** | affiche toute la recette ; boutons **Modifier** et **Supprimer** (avec une alerte de confirmation) | `PlatDetailPage` |
| **Formulaire** | **une seule page pour créer ET modifier** : si l'URL contient un id, on charge la recette et on pré-remplit les champs. Boutons « Prendre une photo » et « Galerie ». Validation des champs | `PanierPage` (saisie, validation, alertes, envoi) |
| **Favoris** | optionnel : comme `useFavoris` de la fiche 04, mais avec des id en `string` | `useFavoris` |

⚠️ **Routeur :** la route `recettes/nouvelle` doit être déclarée **avant** `recettes/:id`.
Sinon, le mot « nouvelle » serait pris pour un id.

⚠️ **Rafraîchir la liste :** après une création ou une suppression, on revient sur la liste. Il faut la recharger avec `onIonViewWillEnter` (vu en fiche 04 pour `CommandesPage`).
`onMounted` ne s'exécute qu'une seule fois, car Ionic garde la page en mémoire.

### Le filtre par ingrédient : deux façons de faire

1. **Côté application (le plus simple)** : on charge toutes les recettes, puis on filtre avec un `computed`, exactement comme la recherche de `MenuPage`.
   Par exemple : `recettes.filter(r => r.ingredients.some(i => i.includes(texte)))`.
2. **Côté Firestore** : `where('ingredients', 'array-contains', 'riz')`. Mais il faut alors le mot **exact**.

Pour un projet d'école avec quelques dizaines de recettes, la solution 1 suffit largement.

---

## 8. Ce qu'on réutilise de la fiche 04

| Fichier fiche 04 | Dans notre projet |
|---|---|
| `vite.config.js`, `tsconfig.json`, `capacitor.config.json`, `main.ts`, `App.vue`, `theme/variables.css` | presque identiques (déjà dans `recette/`) |
| `services/api.ts` | remplacé par `services/recettes.ts` (Firestore) + `firebase.ts` (connexion) |
| `types/gargote.ts` | remplacé par `types/recette.ts` |
| `services/stockage.ts` (Preferences) | réutilisable tel quel pour les favoris |
| `composables/useFavoris.ts` | réutilisable, en passant les id de `number` à `string` |
| `MenuPage.vue` | modèle pour la page Liste |
| `PlatDetailPage.vue` | modèle pour la page Détail (+ Camera déjà utilisée) |
| `PanierPage.vue` | modèle pour les alertes, le loading, les toasts et l'affichage des erreurs dans un `ion-input` |
| `usePanier.ts` | pas utile (pas de panier dans une appli de recettes) |

---

## 9. Les règles de sécurité Firestore

Firestore est accessible depuis internet. Ce sont les **règles** (onglet « Règles » de Firestore dans la console) qui décident qui a le droit de lire et d'écrire.

- **Mode test** : tout est autorisé pendant 30 jours. C'est pratique pour développer.
- **Avant la date d'expiration** (ou avant le rendu), il faut écrire des règles qui au moins **vérifient la forme des données**. Par exemple : le nom est un texte non vide, les ingrédients sont une liste, l'image ne dépasse pas une certaine taille.
- Si on ajoute plus tard une **connexion utilisateur** (Firebase Authentication, gratuit), on pourra dire « seul l'auteur d'une recette peut la modifier ». Ce serait une bonne fonctionnalité bonus.

Si l'application affiche soudain `permission-denied`, c'est presque toujours que **le mode test a expiré** ou que **les règles sont trop strictes**.

---

## 10. Ordre de travail conseillé

Chaque étape doit fonctionner avant de passer à la suivante.

1. ✅ Projet Ionic vide qui démarre (`npm install`, puis `npm run dev`). C'est fait dans `recette/`.
2. Créer le projet Firebase et la base Firestore (partie 5).
3. `npm install firebase`, puis créer `.env` et `firebase.ts`.
4. Écrire le type `Recette`, puis `services/recettes.ts`, avec les 5 fonctions : liste, une recette, créer, modifier, supprimer.
5. **Test rapide :** ajouter une recette **à la main** dans la console Firebase, puis vérifier qu'elle s'affiche dans la page Liste.
6. Page Détail.
7. Page Formulaire, d'abord **sans photo** : créer, puis modifier.
8. Suppression (bouton dans le Détail, avec confirmation).
9. **Photo :** caméra / galerie → réduction → enregistrement dans le champ `image`.
10. Filtres : recherche, catégorie, ingrédient.
11. Bonus : favoris, connexion, etc.
12. Règles de sécurité, puis génération de l'APK Android (comme le bonus de la fiche 08).

### Répartition dans le binôme

On écrit **d'abord ensemble** : le type `Recette` et `services/recettes.ts`. Ensuite :

| Personne A | Personne B |
|---|---|
| Page Liste + filtres (recherche, catégorie, ingrédient) | Page Formulaire (création + modification + validation) |
| Page Détail + suppression | Photo (caméra, galerie, réduction de l'image) |
| Favoris (bonus) | Règles de sécurité Firestore |

Utiliser **Git** (une branche chacun) pour ne pas écraser le travail de l'autre.

---

## 11. Pièges fréquents

| Problème | Cause probable |
|---|---|
| `permission-denied` | mode test expiré ou règles trop strictes |
| la création de recette échoue avec une photo | image trop lourde (> 1 Mo) : elle n'a pas été réduite |
| la liste ne se met pas à jour après un ajout | recharger dans `onIonViewWillEnter`, pas seulement `onMounted` |
| `/tabs/recettes/nouvelle` ouvre le Détail | route `nouvelle` déclarée après `:id` |
| erreur de type sur les id | les id Firestore sont des `string`, plus des `number` |
| erreur « requires an index » | requête avec `where` sur un champ + `orderBy` sur un autre : soit cliquer le lien dans l'erreur pour créer l'index, soit trier côté application |
| la caméra ne s'ouvre pas dans le navigateur | `defineCustomElements(window)` de `@ionic/pwa-elements` manquant dans `main.ts` (vu en fiche 04) |
| `npm install` refuse (ERESOLVE) | versions Capacitor incompatibles : garder toutes les versions `@capacitor/*` alignées (8.5.3) |

---

## 12. Checklist avant le rendu

- [ ] La liste des recettes s'affiche depuis Firestore
- [ ] On peut créer une recette
- [ ] On peut voir le détail d'une recette
- [ ] On peut modifier une recette
- [ ] On peut supprimer une recette (avec confirmation)
- [ ] On peut ajouter une photo (caméra et/ou galerie) et elle s'affiche
- [ ] Le filtre par ingrédient fonctionne
- [ ] Les états chargement / erreur / liste vide sont gérés
- [ ] `npm run typecheck` passe sans erreur
- [ ] Les règles Firestore ne sont plus en mode test
- [ ] L'APK fonctionne sur un vrai téléphone
- [ ] Aucune carte bancaire n'a été ajoutée sur Firebase 😉
