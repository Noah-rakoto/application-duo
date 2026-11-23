# Fiche 06 — L'image d'aperçu

**Durée** : 1 h 30 · **Cours** : `COURS-06-image.md`

## Objectif

Ajouter une image d'aperçu à une recette, depuis l'appareil photo ou la galerie, à la création comme à l'édition.

## 1. Préparer la caméra

Les paquets `@capacitor/camera` et `@ionic/pwa-elements` sont déjà dans `package.json`.
Ajoutez seulement `defineCustomElements(window)` dans `main.ts` (cours, partie 2).

## 2. Le service : `src/services/image.ts`

Écrivez trois fonctions :

```ts
async function compresser(webPath: string): Promise<string>     // interne, cours partie 4
export async function prendrePhoto(): Promise<string | null>
export async function choisirDansGalerie(): Promise<string | null>
```

- `prendrePhoto` : `Camera.takePhoto(...)`, puis `compresser(resultat.webPath)` ;
- `choisirDansGalerie` : `Camera.chooseFromGallery({ allowMultipleSelection: false })`, puis le **premier** élément de `results` ;
- toutes deux renvoient **`null`** si l'utilisateur annule ou si `webPath` est absent.

Survolez `resultat` dans VS Code : quels champs de `MediaResult` sont facultatifs ?

## 3. Dans le formulaire

Dans `RecetteFormPage.vue`, entre la catégorie et les ingrédients :

1. une variable `image = ref<string | null>(null)`, pré-remplie en mode édition ;
2. l'aperçu : `<img v-if="image" :src="image" />`, en pleine largeur, avec des coins arrondis ;
3. deux boutons : **Appareil photo** (`cameraOutline`) et **Galerie** (`imagesOutline`) ;
4. si une image est présente, un bouton **Retirer l'image** (remet `null`) ;
5. `image` est envoyée au service avec le reste (`NouvelleRecette.image`).

Le service n'a presque rien à changer : `image` est un champ comme les autres.
Vérifiez seulement que `creerRecette` et `modifierRecette` l'enregistrent bien.

## 4. Dans la liste et le détail

Ils affichent déjà `recette.image` depuis la fiche 03. Quand il n'y a pas d'image, la liste affiche
une icône à la place (`restaurantOutline` dans le `ion-thumbnail`), pour garder les lignes alignées.

**Vérifiez** :
- créez une recette avec une photo prise dans le navigateur (webcam) : elle s'affiche dans la liste et le détail ;
- éditez-la, choisissez une **grande** image dans la galerie : elle remplace l'ancienne ;
- retirez l'image d'une recette : dans la console Firebase, le champ `image` vaut `null` ;
- dans `prendrePhoto`, affichez `console.log(Math.round(dataUrl.length / 1024), 'Ko')` : notez la taille obtenue ;
- **expérience** : faites renvoyer à `compresser` une version **non réduite** (ratio 1, qualité 1), et enregistrez une grosse photo.
  Notez le message d'erreur exact. Remettez la compression.

## Questions

- **Q6.1** Pourquoi ne peut-on pas enregistrer `webPath` dans Firestore, alors que `<img :src="webPath">` fonctionne dans le formulaire ?
- **Q6.2** Quelle taille (en Ko) avez-vous obtenue après compression ? Quel message a donné l'expérience sans compression ? Expliquez-le.
- **Q6.3** Chaque recette contient son image. Que se passe-t-il pour la **liste** quand il y a 200 recettes ? Proposez une amélioration (indice : la liste n'a pas besoin d'une image de 800 px).

**Faites un commit** : `git add . && git commit -m "fiche 06 - image d'apercu"`.
