<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <!-- Retour vers la liste -->
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/recettes" />
        </ion-buttons>
        <ion-title>{{ recette?.libelle ?? 'Recette' }}</ion-title>

        <!-- Éditer / Supprimer, seulement une fois la recette chargée -->
        <ion-buttons v-if="recette" slot="end">
          <ion-button :router-link="`/tabs/recettes/${recette.id}/modifier`" aria-label="Éditer">
            <ion-icon slot="icon-only" :icon="createOutline" />
          </ion-button>
          <ion-button color="danger" aria-label="Supprimer" @click="supprimer">
            <ion-icon slot="icon-only" :icon="trashOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- 1. Chargement en cours -->
      <div v-if="chargement" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <!-- 2. Erreur (ex. : /tabs/recettes/inexistant) -->
      <div v-else-if="erreur" class="ion-padding">
        <ion-text color="danger">
          <p>{{ erreur }}</p>
        </ion-text>
        <ion-button expand="block" @click="charger">Réessayer</ion-button>
      </div>

      <!-- 3. La recette -->
      <div v-else-if="recette">
        <!-- Image pleine largeur, seulement si elle existe -->
        <img v-if="recette.image" :src="recette.image" alt="" class="image-recette" />

        <div class="ion-padding">
          <ion-badge>{{ libelleCategorie }}</ion-badge>

          <h2>Ingrédients</h2>
          <ion-list v-if="recette.lignes.length > 0" lines="none">
            <ion-item v-for="ligne in recette.lignes" :key="ligne.ingredient.id">
              <ion-label>{{ ligne.quantite }} — {{ ligne.ingredient.libelle }}</ion-label>
            </ion-item>
          </ion-list>
          <ion-text v-else color="medium"><p>Aucun ingrédient</p></ion-text>

          <h2>Préparation</h2>
          <p class="texte-long">{{ recette.preparation }}</p>

          <!-- Remarque : seulement si elle n'est pas vide -->
          <template v-if="recette.remarque?.trim()">
            <h2>Remarque</h2>
            <p class="texte-long">{{ recette.remarque }}</p>
          </template>

          <ion-text color="medium">
            <small>
              Créée le {{ formatDate(recette.date_creation) }}
              · Modifiée le {{ formatDate(recette.date_derniere_modif) }}
            </small>
          </ion-text>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonSpinner, IonText, IonButton, IonBadge, IonList, IonItem, IonLabel, IonIcon, onIonViewWillEnter,
  alertController, loadingController, toastController, useIonRouter,
} from '@ionic/vue';
import { createOutline, trashOutline } from 'ionicons/icons';
import type { Categorie, RecetteDetail } from '@/types/recette';
import { getCategories } from '@/services/categorieService';
import recetteService from '@/services/recetteService';
import { formatDate } from '../../utils/format';

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

<style scoped>
.image-recette {
  width: 100%;
  display: block;
}

/* Garder les retours à la ligne (cours, partie 5) */
.texte-long {
  white-space: pre-line;
}
</style>
