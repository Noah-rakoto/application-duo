import { db } from "@/firebase";
import type {
  Ingredient,
  Recette,
  RecetteDetail,
  NouvelleRecette,
} from "@/types/recette";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import Ingredients from "@/services/ingredientService";

export default {
  async getRecettes(idCategorie?: string | null): Promise<Recette[]> {
    // par defaut
    let q = query(collection(db, "recettes"));
    // si y a une categorie 
    if (idCategorie !== "" && idCategorie !== null && idCategorie !== "tous") {
      q = query(collection(db, "recettes"), where("id_categorie", "==", idCategorie));
    }

    const snapshot = await getDocs(q);
    // snapshot.docs renvoie un NOUVEAU tableau a chaque lecture :
    // on le garde dans une variable pour que le tri ne soit pas perdu
    const docs = snapshot.docs;
    // trier du plus recent au plus ancien
    docs.sort((a, b) => {
      const dateA = a.data().date_creation.toMillis();
      const dateB = b.data().date_creation.toMillis();
      return dateB - dateA;
    });
    return docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Recette);
  },

  async getIdsRecettesAvecIngredient(idIngredient: string[]): Promise<Set<string>> {
    // traiter si tous est dans la liste
    // let q;
    let q = query(collection(db, "recette_ingredients"), where("id_ingredient", "in", idIngredient));
    if (idIngredient.includes("tous") || idIngredient.length === 0) {
      q = query(collection(db, "recette_ingredients"));
    }

    return new Set(await getDocs(q).then((snapshot) => snapshot.docs.map((m) => m.data().id_recette)));
  },

  // get la recette avec ses ingredients (lorsqu'on clique sur une recette)
  async getRecette(id: string): Promise<RecetteDetail> {
    const recetteRef = doc(db, "recettes", id);
    const recetteIngredientsQuery = query(
      collection(db, "recette_ingredients"),
      where("id_recette", "==", id),
    );

    const [recetteSnap, recetteIngredientsSnap, ingredientsSnap] =
      await Promise.all([
        getDoc(recetteRef),
        getDocs(recetteIngredientsQuery),
        getDocs(collection(db, "ingredients")),
      ]);

    if (!recetteSnap.exists()) {
      throw new Error("Cette recette n'existe pas");
    }

    const recette: Recette = {
      id: recetteSnap.id,
      ...recetteSnap.data(),
    } as Recette;
    const ingredientsById = new Map<string, Ingredient>(
      ingredientsSnap.docs.map((ingredientDoc): [string, Ingredient] => [
        ingredientDoc.id,
        {
          id: ingredientDoc.id,
          libelle: ingredientDoc.data().libelle,
        },
      ]),
    );

    const lignes = recetteIngredientsSnap.docs.map((lienDoc) => {
      const lien = lienDoc.data();
      const ingredient = ingredientsById.get(lien.id_ingredient);

      if (!ingredient) {
        throw new Error(`Ingrédient non trouvé : ${lien.id_ingredient}`);
      }

      return { ingredient, quantite: lien.quantite };
    });

    return { ...recette, lignes };
  },
  // crée une recette et ses lignes d'ingrédients, renvoie l'ID de la recette créée
  async creerRecette(nouvelle: NouvelleRecette): Promise<string> {
    // 1. pour chaque ligne du formulaire, on obtient l'ingrédient (existant ou créé)
    //    Promise.all lance toutes les recherches en parallèle et attend qu'elles soient toutes finies
    //    (un forEach sans await n'attendrait pas : on n'aurait pas les IDs à temps)
    const ingredients = await Promise.all(
      // on transforme chaque ligne en une promesse qui renvoie l'Ingredient
      nouvelle.ingredients.map((ligne) =>
        Ingredients.trouverOuCreerIngredient(ligne.libelle),
      ),
    );

    // 2. on ouvre un batch : toutes les écritures seront envoyées ensemble, en une seule fois
    const batch = writeBatch(db);

    // 3. on prépare la référence de la future recette, sans encore rien écrire :
    //    doc(collection(...)) génère un ID tout de suite, côté client
    const recetteRef = doc(collection(db, "recettes"));

    // 4. on prévoit la création du document recette dans le batch
    batch.set(recetteRef, {
      libelle: nouvelle.libelle.trim(), // texte sans espaces autour
      image: nouvelle.image, // null pour l'instant (l'image arrive en fiche 06)
      id_categorie: nouvelle.id_categorie, // l'ID de la catégorie choisie
      preparation: nouvelle.preparation.trim(), // texte sans espaces autour
      remarque: nouvelle.remarque.trim(), // texte sans espaces autour (peut être vide)
      date_creation: serverTimestamp(), // date fixée par le serveur Firestore
      date_derniere_modif: serverTimestamp(), // même date à la création
    });

    // 5. on prévoit un document recette_ingredients par ligne du formulaire
    nouvelle.ingredients.forEach((ligne, index) => {
      // nouvelle référence avec un ID auto-généré dans la collection de liaison
      const lienRef = doc(collection(db, "recette_ingredients"));
      // on relie la recette (ID connu grâce à l'étape 3) et l'ingrédient (même index que la ligne)
      batch.set(lienRef, {
        id_recette: recetteRef.id, // l'ID de la recette préparée plus haut
        id_ingredient: ingredients[index].id, // l'ID de l'ingrédient obtenu à l'étape 1
        quantite: ligne.quantite.trim(), // texte sans espaces autour
      });
    });

    // 6. on envoie le batch : soit tout est écrit, soit rien ne l'est
    await batch.commit();

    // on renvoie l'ID de la recette créée
    return recetteRef.id;
  },

  async modifierRecette(id: string, recette: NouvelleRecette): Promise<void> {
    // 1. en parallèle :
    //    - on obtient l'ingrédient (existant ou créé) pour chaque ligne du formulaire
    //    - on récupère les anciennes lignes de cette recette dans recette_ingredients
    const [ingredients, anciennesLignesSnap] = await Promise.all([
      Promise.all(
        recette.ingredients.map((ligne) =>
          Ingredients.trouverOuCreerIngredient(ligne.libelle),
        ),
      ),
      getDocs(
        query(
          collection(db, "recette_ingredients"),
          where("id_recette", "==", id),
        ),
      ),
    ]);

    const batch = writeBatch(db);

    // 2. on met à jour la recette existante
    //    update (et pas set) : on ne touche qu'à ces champs, date_creation est conservée
    const recetteRef = doc(db, "recettes", id);
    batch.update(recetteRef, {
      libelle: recette.libelle.trim(),
      image: recette.image,
      id_categorie: recette.id_categorie,
      preparation: recette.preparation.trim(),
      remarque: recette.remarque.trim(),
      date_derniere_modif: serverTimestamp(),
    });

    // 3. on supprime toutes les anciennes lignes d'ingrédients de la recette
    anciennesLignesSnap.docs.forEach((lienDoc) => {
      batch.delete(lienDoc.ref);
    });

    // 4. on recrée une ligne par ingrédient du formulaire (comme dans creerRecette)
    recette.ingredients.forEach((ligne, index) => {
      const lienRef = doc(collection(db, "recette_ingredients"));
      batch.set(lienRef, {
        id_recette: id, // l'ID de la recette existante
        id_ingredient: ingredients[index].id,
        quantite: ligne.quantite.trim(),
      });
    });

    // 5. on envoie tout d'un coup : soit tout est écrit, soit rien ne l'est
    await batch.commit();
  },

  async supprimerRecette(id: string): Promise<void> {
    // 1. on récupère les lignes d'ingrédients de cette recette
    const lignesSnap = await getDocs(
      query(
        collection(db, "recette_ingredients"),
        where("id_recette", "==", id),
      ),
    );

    const batch = writeBatch(db);

    // 2. on supprime la recette
    batch.delete(doc(db, "recettes", id));

    // 3. on supprime toutes ses lignes d'ingrédients
    //    (les ingrédients eux-mêmes restent : d'autres recettes peuvent les utiliser)
    lignesSnap.docs.forEach((lienDoc) => {
      batch.delete(lienDoc.ref);
    });

    // 4. on envoie tout d'un coup et on attend la fin
    await batch.commit();
  },
};
