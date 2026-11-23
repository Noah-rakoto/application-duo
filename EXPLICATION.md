# Projet Recettes : ce qu'on va faire et comment

Ce document explique la démarche du projet, étape par étape.
Il ne contient pas le code de l'application : c'est à nous de l'écrire.

---

## 1. Ce que le prof demande, et notre projet

### Les exigences du prof

| Exigence | Chez nous |
|---|---|
| Une liste de notre choix | La liste des **recettes de cuisine** |
| Un formulaire CRUD | Création, lecture, **édition** et **suppression** d'une recette |
| L'upload d'image | Une **image d'aperçu** ajoutée à la création (ou à l'édition) de la recette |
| Firebase | Toutes les données sont dans **Firestore** |

### Notre application (voir `sujet.txt`)

L'application sert à **noter les recettes de cuisine créées par l'utilisateur**.

Une recette contient :
- un **libellé** (le nom) et une **catégorie** ;
- une **image** d'aperçu ;
- une section **Ingrédients** ;
- une section **Préparation**, en texte libre et éditable ;
- une section **Remarque**, en texte libre et éditable ;
- une **date de création** et une **date de dernière modification**.

Les fonctionnalités prévues :
1. créer une recette ;
2. éditer et supprimer une recette ;
3. rechercher une recette (par son libellé) ;
4. rechercher par **catégorie** ;
5. rechercher par **ingrédient**.

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
- des **composables** (`useFavoris`…) pour partager un état entre les pages ;
- **Preferences** (`services/stockage.ts`) pour garder des données sur le téléphone ;
- **Camera** pour prendre une photo ;
- dans chaque page, les états **chargement / erreur / liste vide / liste**, le *pull-to-refresh*, les toasts et les alertes.

**On garde toute cette organisation.** La seule grosse différence, c'est **d'où viennent les données**.

---

## 3. Ce qui change avec Firebase

```
App Ionic + Vue  →  services/*.ts  →  SDK Firebase  →  HTTPS  →  Firestore (serveurs Google)
                                                                    ↑
                                                 les règles de sécurité vérifient chaque requête
```

- **Il n'y a plus de serveur `api/` à lancer.** La base de données est hébergée par Google.
- On installe la bibliothèque `firebase` (`npm install firebase`).
  On ne l'appelle que depuis les **fichiers services**, jamais depuis les pages, comme `api.ts` dans la fiche 04.
- Le téléphone doit avoir **internet** (plus besoin d'être sur le même Wi-Fi que le PC).

### Correspondance API Express → Firestore

| Fiche 04 (API) | Firestore | Rôle |
|---|---|---|
| `GET /plats` | `getDocs(collection(...))` | lire toute une collection |
| `GET /plats?categorie=2` | `getDocs(query(..., where('id_categorie', '==', ...)))` | lire avec un filtre |
| `GET /plats/:id` | `getDoc(doc(...))` | lire un document |
| `POST /plats` | `addDoc(...)` | créer |
| `PUT /plats/:id` | `updateDoc(...)` | modifier |
| `DELETE /plats/:id` | `deleteDoc(...)` | supprimer |
| *(transaction SQL)* | `writeBatch(...)` | plusieurs écritures d'un coup : **tout réussit ou rien** |

### Vocabulaire : SQL → Firestore

| SQL (ce qu'on connaît) | Firestore |
|---|---|
| table | **collection** |
| ligne | **document** |
| colonne | **champ** |
| clé primaire `id` | **ID du document**, généré par Firebase : une **chaîne** du type `"aB3xK9..."` (pas un nombre) |
| clé étrangère | un champ qui contient l'ID d'un autre document (ex. `id_categorie`) |
| `JOIN` | ❌ **n'existe pas** : il faut faire plusieurs lectures et assembler dans l'application |
| `LIKE '%riz%'` | ❌ **n'existe pas** : la recherche dans le texte se fait dans l'application |
| `ON DELETE CASCADE` | ❌ **n'existe pas** : il faut supprimer soi-même les lignes liées |

Ces trois ❌ sont les points les plus importants à comprendre pour notre base (voir partie 6).

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

1. On prend une photo (appareil photo) ou on en choisit une (galerie) avec Capacitor Camera, comme dans la fiche 04.
2. On la **réduit** : environ 800 px maximum, JPEG en qualité 60 %. Pour ça, on la dessine dans un `<canvas>` HTML.
3. Le canvas nous donne une chaîne `"data:image/jpeg;base64,/9j/4AAQ..."` d'environ 50 à 150 Ko.
4. On enregistre cette chaîne dans le champ `image` de la recette.
5. Pour l'afficher : `<img :src="recette.image">`. Ça marche directement.

⚠️ Un document Firestore ne peut pas dépasser **1 Mo**. C'est pour ça qu'il faut **toujours réduire la photo** avant de l'enregistrer.
Une photo brute de téléphone fait 3 à 5 Mo : elle serait refusée.

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
   - `.env` est déjà dans le `.gitignore` : on s'envoie ce fichier entre nous, il ne va pas sur GitHub.
6. **Partager le projet** avec le binôme : Paramètres du projet → Utilisateurs et autorisations → ajouter son adresse Gmail.
7. On ne passe **pas** au forfait Blaze, même si la console le propose.

---

## 6. La base de données

### 6.1 Notre modèle (celui de `sujet.txt`)

```
Categorie(id, libelle)
Ingredient(id, libelle)
Recette(id, libelle, image, id_categorie, preparation, remarque, date_creation, date_derniere_modif)
Recette_ingredients(id, id_mere, id_ingredient)
```

C'est un vrai modèle relationnel. **On le garde** : il est propre, sans doublons, et les ingrédients sont de vraies entités.
Firestore le permet très bien. Il faut juste comprendre comment on remplace les `JOIN` (partie 6.4).

### 6.2 Petites améliorations proposées (optionnelles)

| Proposition | Pourquoi |
|---|---|
| Renommer `id_mere` en **`id_recette`** | plus clair à la lecture du code : on sait tout de suite que ça pointe vers une recette |
| Ajouter **`quantite`** (texte) dans `Recette_ingredients` | la section Ingrédients d'une recette doit dire *combien* : « 200 g », « 2 c. à soupe », « 1 pincée ». La quantité appartient au **lien** recette ↔ ingrédient, pas à l'ingrédient lui-même |
| `libelle` de `Ingredient` enregistré **en minuscules et sans espaces autour** | évite d'avoir « Riz », « riz » et « riz  » comme trois ingrédients différents |
| Dates en type **`Timestamp`** de Firestore | Firestore a un vrai type date ; `serverTimestamp()` prend l'heure du serveur Google, pas celle du téléphone (qui peut être fausse) |

Avec ces améliorations, la section Ingrédients d'une recette s'affiche ainsi :

```
Ingrédients
• 500 g  — zébu
• 1 botte — brèdes
• 1 morceau — gingembre
```

### 6.3 Les collections dans Firestore

On crée **4 collections**, une par table :

**`categories`**

| Champ | Type | Exemple |
|---|---|---|
| *(ID du document)* | string | `"c7Hq..."` |
| `libelle` | string | `"Plat"` |

**`ingredients`**

| Champ | Type | Exemple |
|---|---|---|
| *(ID du document)* | string | `"i91K..."` |
| `libelle` | string | `"riz"` |

**`recettes`**

| Champ | Type | Exemple |
|---|---|---|
| *(ID du document)* | string | `"aB3x..."` |
| `libelle` | string | `"Romazava"` |
| `image` | string ou null | `"data:image/jpeg;base64,..."` |
| `id_categorie` | string | `"c7Hq..."` (ID d'un document de `categories`) |
| `preparation` | string | texte libre, sur plusieurs lignes |
| `remarque` | string | texte libre (peut être vide) |
| `date_creation` | Timestamp | 23 nov. 2026 à 20:30 |
| `date_derniere_modif` | Timestamp | 24 nov. 2026 à 09:12 |

**`recette_ingredients`**

| Champ | Type | Exemple |
|---|---|---|
| *(ID du document)* | string | `"x0Pz..."` |
| `id_recette` | string | `"aB3x..."` |
| `id_ingredient` | string | `"i91K..."` |
| `quantite` | string | `"500 g"` |

L'`id` de nos tables devient l'**ID du document**. On ne le stocke pas en plus dans les champs : Firestore le donne avec `doc.id`.

Dans le code, chaque collection a son **type TypeScript** (`Categorie`, `Ingredient`, `Recette`, `RecetteIngredient`), comme `types/gargote.ts` dans la fiche 04.

### 6.4 Remplacer les `JOIN` : comment faire chaque fonctionnalité

Firestore n'a pas de `JOIN`. On fait donc **plusieurs lectures** et on assemble les résultats dans l'application.
Avec quelques dizaines de recettes, c'est très rapide.

**Afficher la liste des recettes avec leur catégorie**
1. Lire toutes les `categories` (une seule fois au démarrage : elles changent rarement).
2. Lire les `recettes`.
3. Pour chaque recette, retrouver le libellé de sa catégorie grâce à `id_categorie`.

**Afficher le détail d'une recette avec ses ingrédients**
1. Lire la recette : `getDoc`.
2. Lire ses liens : `recette_ingredients` où `id_recette == <id de la recette>`.
3. Pour chaque lien, retrouver le libellé de l'ingrédient grâce à `id_ingredient`.
   Le plus simple : charger tous les `ingredients` une seule fois et chercher dedans.

**Rechercher par catégorie**
- `recettes` où `id_categorie == <id choisi>`. C'est une requête Firestore directe.

**Rechercher par ingrédient**
1. L'utilisateur choisit un ingrédient dans la liste des `ingredients`.
2. Lire `recette_ingredients` où `id_ingredient == <id choisi>`. On obtient la liste des `id_recette`.
3. Afficher les recettes dont l'ID est dans cette liste.
   On peut garder les recettes déjà chargées et les filtrer dans l'application.

**Rechercher par libellé (texte tapé)**
- Firestore ne sait pas faire `LIKE '%texte%'`.
- On filtre donc **dans l'application**, avec un `computed`, exactement comme la barre de recherche de `MenuPage` dans la fiche 04.

### 6.5 Écrire sans casser la base : `writeBatch`

Une recette, c'est **plusieurs documents** : la recette elle-même et ses lignes `recette_ingredients`.
Si l'application plante au milieu, on risque une recette sans ingrédients, ou des liens qui pointent vers une recette qui n'existe plus.

La solution, c'est un **batch** (`writeBatch`). On prépare plusieurs écritures, puis on les envoie d'un coup : **tout réussit ou rien n'est fait**.
C'est l'équivalent d'une transaction SQL.

**Créer une recette**
1. Si l'utilisateur a tapé un ingrédient qui n'existe pas encore, le créer dans `ingredients`.
   Avant ça, vérifier qu'il n'existe pas déjà avec le même libellé.
2. Dans un seul batch :
   - créer la recette (`date_creation` = `date_derniere_modif` = maintenant) ;
   - créer une ligne `recette_ingredients` par ingrédient.

   Astuce : `doc(collection(db, 'recettes'))` donne **l'ID de la future recette avant même de l'enregistrer**. On peut donc s'en servir dans les lignes `recette_ingredients` du même batch.

**Éditer une recette**
- Dans un seul batch :
  - mettre à jour la recette (`date_derniere_modif` = maintenant, **ne pas toucher** à `date_creation`) ;
  - **supprimer toutes** ses anciennes lignes `recette_ingredients` ;
  - **recréer** les lignes avec les ingrédients du formulaire.
- C'est plus simple que de chercher lesquels ont changé.

**Supprimer une recette**
- Pas de `ON DELETE CASCADE`. Dans un seul batch :
  - supprimer la recette ;
  - supprimer **toutes** ses lignes `recette_ingredients`.

**Supprimer une catégorie ou un ingrédient** (si on fait une page de gestion)
- Interdire la suppression s'ils sont encore utilisés par une recette.
- Pour le vérifier, chercher dans `recettes` (pour une catégorie) ou dans `recette_ingredients` (pour un ingrédient).

### 6.6 Organisation des services

Comme `api.ts` dans la fiche 04, **les pages ne parlent jamais à Firestore directement** :

| Fichier | Rôle |
|---|---|
| `firebase.ts` | connexion à Firebase (lit le `.env`), exporte `db` |
| `services/categories.ts` | lire / créer / supprimer des catégories |
| `services/ingredients.ts` | lire / créer des ingrédients, trouver un ingrédient par libellé |
| `services/recettes.ts` | liste, détail (avec ingrédients), création, édition et suppression **en batch** |
| `services/image.ts` | caméra / galerie → réduction → chaîne base64 |

### 6.7 Données de départ

Les **catégories** (Entrée, Plat, Dessert, Boisson…) sont à créer **à la main dans la console Firebase**, ou avec une petite fonction appelée une seule fois.
Sans catégories, on ne peut pas créer de recette.

Les **ingrédients** se créent tout seuls : quand on tape un ingrédient nouveau dans le formulaire, il est ajouté à `ingredients`.

---

## 7. Les pages de l'application

```
Onglets (TabsPage)
├── Recettes   /tabs/recettes              → liste + recherche + filtres
│     ├── Nouvelle   /tabs/recettes/nouvelle       → formulaire vide
│     ├── Détail     /tabs/recettes/:id            → voir, Éditer, Supprimer
│     └── Éditer     /tabs/recettes/:id/modifier   → même formulaire, pré-rempli
└── (optionnel) Gestion  /tabs/gestion     → gérer catégories et ingrédients
```

| Page | Ce qu'elle fait | Équivalent fiche 04 |
|---|---|---|
| **Liste** | image d'aperçu + libellé + catégorie de chaque recette ; barre de recherche (libellé) ; segment ou `ion-select` pour la **catégorie** ; `ion-select` pour l'**ingrédient** ; bouton « + » pour créer | `MenuPage` |
| **Détail** | image, catégorie, section **Ingrédients** (quantité + libellé), section **Préparation**, section **Remarque**, dates de création et de modification ; boutons **Éditer** et **Supprimer** (avec alerte de confirmation) | `PlatDetailPage` |
| **Formulaire** | **une seule page pour créer ET éditer** : si l'URL contient un id, on charge la recette et on pré-remplit les champs. Contient : libellé (`ion-input`), catégorie (`ion-select`), image (boutons « Appareil photo » / « Galerie » + aperçu), ingrédients (une ligne par ingrédient : choisir ou taper l'ingrédient, taper la quantité, bouton supprimer la ligne, bouton « + Ajouter un ingrédient »), préparation et remarque (`ion-textarea`) | `PanierPage` (saisie, validation, alertes, loading, toasts) |
| **Gestion** (optionnel) | ajouter / renommer / supprimer des catégories et des ingrédients | nouveau |

Validation du formulaire, avant l'envoi :
- libellé obligatoire ;
- catégorie obligatoire ;
- au moins un ingrédient ;
- préparation obligatoire.

Afficher les erreurs sous les champs avec `error-text`, comme le numéro de table dans `PanierPage`.

⚠️ **Routeur :** la route `recettes/nouvelle` doit être déclarée **avant** `recettes/:id`.
Sinon, le mot « nouvelle » serait pris pour un id.

⚠️ **Rafraîchir la liste :** après une création, une édition ou une suppression, on revient sur la liste. Il faut la recharger avec `onIonViewWillEnter` (vu en fiche 04 pour `CommandesPage`).
`onMounted` ne s'exécute qu'une seule fois, car Ionic garde la page en mémoire.

💡 **Liste plus légère (optionnel)** : chaque recette contient son image (50 à 150 Ko). Avec beaucoup de recettes, la liste devient lourde à charger.
Si ça devient lent, on peut enregistrer en plus une **miniature** (par exemple 150 px, environ 10 Ko) dans un champ `miniature` et l'utiliser dans la liste. L'image complète ne sert alors que dans le Détail.

---

## 8. Ce qu'on réutilise de la fiche 04

| Fichier fiche 04 | Dans notre projet |
|---|---|
| `vite.config.js`, `tsconfig.json`, `capacitor.config.json`, `main.ts`, `App.vue`, `theme/variables.css` | presque identiques (déjà dans `recette/`) |
| `services/api.ts` | remplacé par `firebase.ts` + les services de la partie 6.6 |
| `types/gargote.ts` | remplacé par nos types : `Categorie`, `Ingredient`, `Recette`, `RecetteIngredient` |
| `services/stockage.ts` (Preferences) | utile seulement si on ajoute des favoris ou des préférences locales |
| `MenuPage.vue` | modèle pour la page Liste (recherche, segment, `computed` de filtrage) |
| `PlatDetailPage.vue` | modèle pour la page Détail (+ Camera déjà utilisée) |
| `PanierPage.vue` | modèle pour les alertes, le loading, les toasts et l'affichage des erreurs dans un `ion-input` |
| `CommandesPage.vue` | modèle pour l'affichage des dates (`formatDate`) et `onIonViewWillEnter` |
| `usePanier.ts` | pas utile (pas de panier dans notre appli) |

---

## 9. Les règles de sécurité Firestore

Firestore est accessible depuis internet. Ce sont les **règles** (onglet « Règles » de Firestore dans la console) qui décident qui a le droit de lire et d'écrire.

- **Mode test** : tout est autorisé pendant 30 jours. C'est pratique pour développer.
- **Avant la date d'expiration** (ou avant le rendu), il faut écrire des règles **pour chacune des 4 collections** qui au moins **vérifient la forme des données**. Par exemple :
  - `categories` / `ingredients` : `libelle` est un texte non vide ;
  - `recettes` : `libelle` et `preparation` sont des textes non vides, `id_categorie` est un texte, l'image ne dépasse pas une certaine taille ;
  - `recette_ingredients` : `id_recette` et `id_ingredient` sont des textes.
- Si on ajoute plus tard une **connexion utilisateur** (Firebase Authentication, gratuit), chaque recette pourrait avoir un champ `id_utilisateur`.
  On pourrait alors dire « seul l'auteur d'une recette peut la voir et la modifier ». Ça colle bien avec « les recettes créées par l'utilisateur ». C'est une bonne idée de fonctionnalité bonus.

Si l'application affiche soudain `permission-denied`, c'est presque toujours que **le mode test a expiré** ou que **les règles sont trop strictes**.

---

## 10. Ordre de travail conseillé

Chaque étape doit fonctionner avant de passer à la suivante.

1. ✅ Projet Ionic vide qui démarre (`npm install`, puis `npm run dev`). C'est fait dans `recette/`.
2. Créer le projet Firebase et la base Firestore (partie 5).
3. `npm install firebase`, puis créer `.env` et `firebase.ts`.
4. **Ensemble :** valider le modèle (partie 6), puis écrire les 4 types TypeScript.
5. Créer quelques **catégories** à la main dans la console Firebase.
6. Services `categories.ts` et `ingredients.ts` (lecture et création).
7. Service `recettes.ts` : liste et détail d'abord.
8. **Test rapide :** ajouter une recette et ses `recette_ingredients` **à la main** dans la console, puis vérifier qu'elle s'affiche dans la Liste et le Détail.
9. Page Formulaire, d'abord **sans image** : création (en batch).
10. Édition (même formulaire, en batch).
11. Suppression (en batch, avec confirmation).
12. **Image :** caméra / galerie → réduction → enregistrement dans le champ `image`.
13. Recherches : libellé, catégorie, ingrédient.
14. Bonus : page Gestion, miniatures, connexion utilisateur…
15. Règles de sécurité, puis génération de l'APK Android (comme le bonus de la fiche 08).

### Répartition dans le binôme

On fait **d'abord ensemble** : le modèle, les types et `firebase.ts`. Ensuite :

| Personne A | Personne B |
|---|---|
| `categories.ts`, `ingredients.ts` | `recettes.ts` (avec les batchs) |
| Page Liste + les 3 recherches | Page Formulaire (création + édition + validation) |
| Page Détail + suppression | Image (caméra, galerie, réduction) |
| Page Gestion (bonus) | Règles de sécurité Firestore |

Utiliser **Git** (une branche chacun) pour ne pas écraser le travail de l'autre.

---

## 11. Pièges fréquents

| Problème | Cause probable |
|---|---|
| `permission-denied` | mode test expiré ou règles trop strictes |
| la création de recette échoue avec une image | image trop lourde (> 1 Mo) : elle n'a pas été réduite |
| des `recette_ingredients` « orphelins » restent après une suppression | la suppression n'a pas supprimé les liens (pas de cascade) : utiliser un batch |
| ingrédients en double (« Riz » et « riz ») | libellé pas mis en minuscules, ou pas de vérification avant la création |
| `date_creation` change à chaque édition | on a renvoyé `date_creation` dans l'édition : ne mettre à jour que `date_derniere_modif` |
| la liste ne se met pas à jour après un ajout | recharger dans `onIonViewWillEnter`, pas seulement `onMounted` |
| `/tabs/recettes/nouvelle` ouvre le Détail | route `nouvelle` déclarée après `:id` |
| erreur de type sur les id | les id Firestore sont des `string`, plus des `number` |
| erreur « requires an index » | requête avec `where` sur un champ + `orderBy` sur un autre : soit cliquer le lien dans l'erreur pour créer l'index, soit trier côté application |
| la caméra ne s'ouvre pas dans le navigateur | `defineCustomElements(window)` de `@ionic/pwa-elements` manquant dans `main.ts` (vu en fiche 04) |
| `npm install` refuse (ERESOLVE) | versions Capacitor incompatibles : garder toutes les versions `@capacitor/*` alignées (8.5.3) |

---

## 12. Checklist avant le rendu

- [ ] Les 4 collections existent : `categories`, `ingredients`, `recettes`, `recette_ingredients`
- [ ] La liste des recettes s'affiche depuis Firestore, avec image et catégorie
- [ ] On peut créer une recette avec image, catégorie, ingrédients (+ quantités), préparation et remarque
- [ ] On peut voir le détail d'une recette (sections Ingrédients / Préparation / Remarque + dates)
- [ ] On peut éditer une recette (`date_derniere_modif` change, `date_creation` non)
- [ ] On peut supprimer une recette, et ses `recette_ingredients` disparaissent aussi
- [ ] Recherche par libellé, par catégorie et par ingrédient
- [ ] Les états chargement / erreur / liste vide sont gérés
- [ ] `npm run typecheck` passe sans erreur
- [ ] Les règles Firestore ne sont plus en mode test
- [ ] L'APK fonctionne sur un vrai téléphone
- [ ] Aucune carte bancaire n'a été ajoutée sur Firebase 😉
