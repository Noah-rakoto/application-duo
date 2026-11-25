import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import type { Categorie } from "@/types/recette";

export async function getCategories(): Promise<Categorie[]> {
    const snapshot = await getDocs(collection(db, "categories"));
    // console.log("snapshot", snapshot);
    // snapshot.docs est un tableau de documents, chacun ayant un id et des données
    // ca retourne un tableau de Categorie, en utilisant le spread operator pour copier les données du document et ajouter l'id
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Categorie);
}
