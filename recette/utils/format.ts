import {
  leafOutline, restaurantOutline, iceCreamOutline, wineOutline, fastFoodOutline,
  flameOutline, cafeOutline, fishOutline, pizzaOutline,
} from 'ionicons/icons';
import type { Timestamp } from 'firebase/firestore';

export function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
// Icône d'affichage d'une catégorie (purement visuel). Inconnue : couverts.
const ICONES: Record<string, string> = {
  entree: leafOutline, salade: leafOutline, plat: restaurantOutline, dessert: iceCreamOutline,
  boisson: wineOutline, snack: fastFoodOutline, soupe: flameOutline, petitdejeuner: cafeOutline,
  gouter: cafeOutline, poisson: fishOutline, pizza: pizzaOutline,
};
export function iconeCategorie(libelle?: string): string {
  return ICONES[normaliser(libelle ?? '').replace(/[^a-z]/g, '')] ?? restaurantOutline;
}
