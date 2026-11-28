<template>
  <ion-page>
    <ion-content>
      <!-- Boutons flottants par-dessus la photo -->
      <div class="actions">
        <ion-back-button default-href="/tabs/recettes" text="" class="rond" />
        <!-- Éditer / Supprimer, seulement une fois la recette chargée -->
        <div v-if="recette" class="actions-droite">
          <ion-button class="rond" :router-link="`/tabs/recettes/${recette.id}/modifier`" aria-label="Éditer">
            <ion-icon slot="icon-only" :icon="createOutline" />
          </ion-button>
          <ion-button class="rond danger" aria-label="Supprimer" @click="supprimer">
            <ion-icon slot="icon-only" :icon="trashOutline" />
          </ion-button>
        </div>
      </div>

      <!-- 1. Chargement en cours -->
      <div v-if="chargement" class="etat">
        <ion-spinner name="dots" color="primary" />
      </div>

      <!-- 2. Erreur (ex. : /tabs/recettes/inexistant) -->
      <div v-else-if="erreur" class="etat">
        <span class="etat-icone"><ion-icon :icon="alertCircleOutline" /></span>
        <p>{{ erreur }}</p>
        <ion-button color="secondary" @click="charger">Réessayer</ion-button>
      </div>

      <!-- 3. La recette -->
      <div v-else-if="recette">
        <!-- Photo pleine largeur (ou un fond coloré si elle n'existe pas) -->
        <img v-if="recette.image" :src="recette.image" alt="" class="image-recette" />
        <div v-else class="image-recette sans-image"><ion-icon :icon="iconeCategorie(libelleCategorie)" /></div>

        <!-- Feuille qui remonte sur la photo -->
        <div class="feuille">
          <span class="puce"><ion-icon :icon="iconeCategorie(libelleCategorie)" /> {{ libelleCategorie }}</span>
          <h1>{{ recette.libelle }}</h1>

          <div class="stats">
            <div>
              <strong>{{ recette.lignes.length }}</strong>
              <span>ingrédient(s)</span>
            </div>
            <div>
              <strong>{{ formatDate(recette.date_creation).split(' ')[0] }}</strong>
              <span>créée le</span>
            </div>
          </div>

          <h2>Ingrédients</h2>
          <ul v-if="recette.lignes.length > 0" class="carte ingredients">
            <li v-for="ligne in recette.lignes" :key="ligne.ingredient.id">
              <span class="nom">{{ ligne.ingredient.libelle }}</span>
              <span class="quantite">{{ ligne.quantite }}</span>
            </li>
          </ul>
          <p v-else class="vide">Aucun ingrédient</p>

          <h2>Préparation</h2>
          <p class="texte-long carte">{{ recette.preparation }}</p>

          <!-- Remarque : seulement si elle n'est pas vide -->
          <template v-if="recette.remarque?.trim()">
            <h2>Remarque</h2>
            <p class="texte-long carte remarque"><ion-icon :icon="bulbOutline" class="ampoule" /> {{ recette.remarque }}</p>
          </template>

          <p class="dates">
            Créée le {{ formatDate(recette.date_creation) }}
            · Modifiée le {{ formatDate(recette.date_derniere_modif) }}
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonBackButton, IonContent,
  IonSpinner, IonButton, IonIcon, onIonViewWillEnter,
  alertController, loadingController, toastController, useIonRouter,
} from '@ionic/vue';
import { createOutline, trashOutline, alertCircleOutline, bulbOutline } from 'ionicons/icons';
import type { Categorie, RecetteDetail } from '@/types/recette';
import { getCategories } from '@/services/categorieService';
import recetteService from '@/services/recetteService';
import { formatDate, iconeCategorie } from '../../utils/format';

const route = useRoute();
const ionRouter = useIonRouter();

const recette = ref<RecetteDetail | null>(null);
const categories = ref<Categorie[]>([]);
const chargement = ref(true);
const erreur = ref<string | null>(null);

const libelleCategorie = computed(() =>
  categories.value.find(c => c.id === recette.value?.id_categorie)?.libelle ?? 'Sans catégorie'
);

async function charger() {
  chargement.value = true;
  erreur.value = null;
  try {
    const id = route.params.id as string;
    // Les deux requêtes en parallèle
    const [r, cats] = await Promise.all([
      recetteService.getRecette(id),
      getCategories(),
    ]);
    recette.value = r;
    categories.value = cats;
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Impossible de charger la recette.';
    console.error(e);
  } finally {
    chargement.value = false;
  }
}

async function supprimer() {
  if (!recette.value) return;

  // 1. on demande confirmation
  const alerte = await alertController.create({
    header: 'Supprimer la recette ?',
    message: 'Cette action est définitive.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Supprimer', role: 'destructive' },
    ],
  });
  await alerte.present();
  const { role } = await alerte.onDidDismiss();
  if (role !== 'destructive') return; // annulé : rien ne change

  // 2. chargement pendant la suppression
  const loading = await loadingController.create({ message: 'Suppression…' });
  await loading.present();

  try {
    await recetteService.supprimerRecette(recette.value.id);

    const toast = await toastController.create({ message: 'Recette supprimée', duration: 2000, color: 'success' });
    await toast.present();

    // 3. retour à la liste ; 'replace' : la page Détail (d'une recette qui n'existe plus)
    //    est retirée de l'historique
    ionRouter.navigate('/tabs/recettes', 'back', 'replace');
  } catch (e) {
    const toast = await toastController.create({
      message: e instanceof Error ? e.message : 'Erreur lors de la suppression',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    console.error(e);
  } finally {
    await loading.dismiss();
  }
}

// À chaque arrivée : la recette a pu être modifiée entre-temps (fiche 05)
onIonViewWillEnter(charger);
</script>

<style scoped src="../theme/pages/RecetteDetailPage.css"></style>
