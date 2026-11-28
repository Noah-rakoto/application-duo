import { db } from "@/firebase";
import type { Ingredient } from "@/types/recette"
import { addDoc, collection, getDoc, getDocs, query, where } from "firebase/firestore";
    
export default {
    async getIngredients(): Promise<Ingredient[]> {
        const snapshot = await getDocs(collection(db, "ingredients"));
        const ingredients = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Ingredient);
        // trier par ordre alphabetique
        ingredients.sort((a, b) => a.libelle.localeCompare(b.libelle));
        return ingredients;
    },

    async trouverOuCreerIngredient(libelle: string): Promise<Ingredient> {
        // normaliser le libelle
        const libelleNormalise = libelle.trim().toLowerCase();

        // recherche
        const q = query(
            collection(db, "ingredients"),
            where("libelle", "==", libelleNormalise)
        );
        const snapshot = await getDocs(q);

        // si existe, return
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data()} as Ingredient;
        } else {
            //sinon, creer et return
            const docRef = await addDoc(collection(db, "ingredients"), {libelle: libelleNormalise});
            const ingredient: Ingredient = {id: docRef.id, libelle: libelleNormalise};
            return ingredient;
        }

    }
}