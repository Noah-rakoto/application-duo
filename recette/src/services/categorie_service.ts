import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import type { Categorie } from "@/types/recette";

export async function getCategories(): Promise<Categorie[]> {
    const snapshot = await getDocs(collection(db, "categories"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Categorie);
}
