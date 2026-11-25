import { db } from "@/firebase";
import type { Ingredient, Recette, RecetteDetail } from "@/types/recette";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export default {
  async getRecettes(): Promise<Recette[]> {
    const snapshot = await getDocs(collection(db, "recettes"));
    // trier du plus recent au plus ancien
    snapshot.docs.sort((a, b) => {
        const dateA = a.data().date_creation.toMillis();
        const dateB = b.data().date_creation.toMillis();
        return dateB - dateA;
    } );
    return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Recette);
  },

  // get la recette avec ses ingredients (lorsqu'on clique sur une recette)
  async getRecette(id: string): Promise<RecetteDetail> {
    const recetteRef = doc(db, "recettes", id);
    const recetteIngredientsQuery = query(
      collection(db, "recette_ingredients"),
      where("id_recette", "==", id)
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
      ingredientsSnap.docs.map(
        (ingredientDoc): [string, Ingredient] => [
          ingredientDoc.id,
          {
            id: ingredientDoc.id,
            libelle: ingredientDoc.data().libelle,
          },
        ]
      )
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
};