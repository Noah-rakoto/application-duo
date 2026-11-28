# Fiche 01 — Firebase et Firestore

**Durée** : 1 h 30 · **Cours** : `COURS-01-firebase-et-firestore.md` · **À faire** : à deux

## Objectif

Créer le projet Firebase, connecter l'application vide de `recette/` à Firestore,
et afficher une première collection à l'écran.

## 1. Créer le projet Firebase

Une seule personne le fait, puis elle partage l'accès.

1. Aller sur **console.firebase.google.com**, puis **Créer un projet** (ex. « recettes-duo »). Google Analytics n'est pas utile.
2. **Build → Firestore Database → Créer une base de données**.
   - Région : `europe-west1` (ou une autre en Europe).
   - **Mode test**. Notez la date d'expiration affichée (2026, 12, 24): vous écrirez les vraies règles en fiche 08.
3. **Paramètres du projet** (roue dentée) → **Vos applications** → icône **Web `</>`**.
   Enregistrez une application et **gardez la page ouverte** : elle affiche `firebaseConfig`.
4. **Paramètres du projet → Utilisateurs et autorisations** : ajoutez l'adresse Gmail du binôme.

⚠️ Si la console propose de passer au forfait **Blaze**, refusez.

## 2. Créer la collection `categories` à la main

Dans **Firestore Database → Démarrer une collection** :

- ID de la collection : `categories` ;
- premier document : **ID automatique**, un champ `libelle` de type `string`, valeur `Entrée`.

Ajoutez de la même façon `Plat`, `Dessert` et `Boisson`.

**Vérifiez** : la collection contient 4 documents, chacun avec un ID du type `"c7HqP2..."` et un seul champ `libelle`.

## 3. Installer le SDK

```bash
cd recette
npm install firebase@13.4.0
```

## 4. La configuration

Créez **`recette/.env`** avec les valeurs de `firebaseConfig` :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env` est déjà dans `.gitignore`. Vérifiez avec `git status` qu'il n'apparaît pas, puis envoyez-le au binôme par message.

Complétez **`src/env.d.ts`** pour que TypeScript connaisse les quatre variables (voir le cours, partie 4).

## 5. `src/firebase.ts`

Écrivez le fichier qui initialise Firebase et **exporte `db`** (voir le cours, partie 4).
C'est le **seul** fichier du projet qui appelle `initializeApp`.

## 6. Afficher les catégories (test)

Dans `views/HomePage.vue`, en vous inspirant de `MenuPage.vue` du TP :

1. une variable `categories` (un tableau de `{ id: string, libelle: string }`), plus `chargement` et `erreur` ;
2. une fonction `charger()` qui lit la collection `categories` avec `getDocs` et remplit le tableau ;
3. les quatre états à l'écran : chargement (`ion-spinner`), erreur (message + bouton « Réessayer »), liste vide, liste (`ion-list` / `ion-item`) ;
4. un `ion-refresher`.

Ce code de lecture est **provisoire** : à la fiche 02, il partira dans un service.

**Vérifiez** :
- les 4 catégories s'affichent ;
- ajoutez une catégorie `Snack` dans la console, puis tirez pour rafraîchir : elle apparaît, **sans relancer l'application** ;
- arrêtez `npm run dev`, mettez une mauvaise valeur dans `VITE_FIREBASE_PROJECT_ID`, relancez : notez ce qui s'affiche et ce que dit la console (F12). Remettez la bonne valeur.

`npm run typecheck` ne doit afficher aucune erreur.

## Questions

- **Q1.1** Les valeurs de `.env` finissent dans le code de l'application (et donc dans l'APK). Ce ne sont donc pas de vrais secrets. Qu'est-ce qui empêche alors n'importe qui d'effacer notre base ?
- **Q1.2** Dans les TP, l'API Express vérifiait les données envoyées (le numéro de table, par exemple). Maintenant qu'il n'y a plus d'API, qui peut faire ce travail ? Est-ce que la vérification dans l'application suffit ?
- **Q1.3** À l'étape 6, avec un mauvais `PROJECT_ID`, qu'avez-vous observé à l'écran et dans la console ? Combien de temps l'application a-t-elle mis à afficher l'erreur ?

**Faites un commit** : `git add . && git commit -m "fiche 01 - connexion firebase"`.
