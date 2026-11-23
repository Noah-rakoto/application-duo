**SUPPORT DE COURS · FICHE 08**

# Sécurité et Android

*Projet Recettes · Ionic, Vue, TypeScript et Firebase*

## Objectif

Remplacer le mode test par de vraies règles de sécurité, puis installer l'application sur un téléphone Android.

---

## 1. Les règles : le « serveur » de Firestore

Dans les TP, l'API Express refusait les données invalides (erreur 422). Avec Firebase, c'est le rôle des **règles de sécurité**.
Elles s'exécutent **chez Google**, à chaque lecture et à chaque écriture. Personne ne peut les contourner, pas même avec la console du navigateur.

La vérification dans le formulaire est un **confort** : un retour immédiat pour l'utilisateur. Les règles sont la **sécurité**.

⚠️ Le mode test (`allow read, write: if request.time < timestamp.date(...)`) **expire au bout de 30 jours**.
Après cette date, toute requête est refusée : `permission-denied`.

## 2. La forme d'un fichier de règles

On les écrit dans **Firestore Database → Règles**, puis **Publier**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function texteNonVide(v) {
      return v is string && v.trim().size() > 0;
    }

    match /categories/{id} {
      allow read: if true;
      allow create, update: if texteNonVide(request.resource.data.libelle)
                            && request.resource.data.keys().hasOnly(['libelle']);
      allow delete: if false;
    }
  }
}
```

| Élément | Signification |
|---|---|
| `match /categories/{id}` | s'applique à chaque document de `categories` |
| `allow read / create / update / delete` | l'opération est permise **si** la condition est vraie |
| `request.resource.data` | les données **après** l'écriture demandée |
| `resource.data` | les données **avant** (ce qui est déjà en base) |
| `request.time` | l'heure du serveur au moment de la requête |
| `v is string`, `v.size()`, `v.trim()` | type, longueur, espaces retirés |
| `keys().hasOnly([...])` | aucun champ en dehors de cette liste |
| `keys().hasAll([...])` | tous ces champs sont présents |
| `function` | une condition réutilisable |

Ce qui n'est pas explicitement autorisé est **refusé**.

## 3. Vérifier les dates

`serverTimestamp()` (fiche 04) vaut exactement `request.time` dans les règles :

```
allow create: if request.resource.data.date_creation == request.time && ...;
allow update: if request.resource.data.date_creation == resource.data.date_creation   // inchangée
              && request.resource.data.date_derniere_modif == request.time && ...;
```

## 4. Tester les règles

Dans l'onglet **Règles**, le **Terrain de jeu des règles** (*Rules Playground*) simule une requête
(type, chemin, données) et indique **quelle ligne** l'autorise ou la refuse, sans toucher à la base.

## 5. Android

Comme dans la fiche 08 du TP (Android Studio nécessaire) :

```bash
npm run build            # vérifie les types puis produit dist/
npx cap add android      # une seule fois
npx cap sync             # à refaire après chaque build
npx cap open android     # lancer sur un émulateur ou un téléphone
```

**Différence avec le TP** : plus besoin de l'adresse IP du PC dans `.env`.
L'application parle directement aux serveurs de Google : le téléphone a juste besoin d'**internet**.

> **À RETENIR**
> | | |
> |---|---|
> | Règles | la vraie sécurité, exécutées chez Google |
> | `request.resource.data` / `resource.data` | après / avant l'écriture |
> | Non autorisé = refusé | on autorise au cas par cas |
> | Mode test | expire en 30 jours |

---

> **AU TP**
> **Fiche 08 — Sécurité et Android** · Durée indicative : 1 h 30 · Énoncé : `fiche-08/08-securite-et-android.md`
> - Règles pour les 4 collections
> - Tests dans le terrain de jeu et dans l'application
> - APK Android · Q8.1 à Q8.3 · commit final
