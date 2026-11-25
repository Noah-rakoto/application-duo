import { Timestamp } from "firebase/firestore";

export interface Categorie{
    id:string;
    libelle:string;
}

// id_ingredient : FUPMqxiWaULj8MZnivJd , XIur5uhn147TXs33GJBV, ssaoLPhu0EZiVrhPNO5L
export interface Ingredient {
    id: string;
    libelle: string;
}

// id_recette : B6HgnTzQukvKmWb3zlka
export interface Recette {
    id: string;
    libelle: string;
    image: string | null;
    id_categorie: string;
    preparation: string;
    remarque: string;
    date_creation: Timestamp
    date_derniere_modif: Timestamp
}

export interface RecetteIngredient {
    id: string;
    id_recette: string;
    id_ingredient: string;
    quantite: string;
}

// pour l'affichage
export interface LigneIngredient {
    ingredient: Ingredient;
    quantite: string;
}

export interface RecetteDetail extends Recette {
    lignes: LigneIngredient[];
}