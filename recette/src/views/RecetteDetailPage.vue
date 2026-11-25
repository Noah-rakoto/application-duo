<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <!-- Retour vers la liste -->
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/recettes" />
        </ion-buttons>
        <ion-title>{{ recette?.libelle ?? 'Recette' }}</ion-title>
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
  IonSpinner, IonText, IonButton, IonBadge, IonList, IonItem, IonLabel, onIonViewWillEnter,
} from '@ionic/vue';
import type { Categorie, RecetteDetail } from '@/types/recette';
import { getCategories } from '@/services/categorieService';
import recetteService from '@/services/recetteService';
import { formatDate } from '../../utils/format';

const route = useRoute();

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
