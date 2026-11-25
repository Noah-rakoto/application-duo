<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Recettes du jours </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Liste des categories</p>

      <ion-spinner v-if="chargement" />
      <p v-else-if="erreur" class="erreur">{{ erreur }}</p>
      <p v-else-if="categories.length === 0">Aucune catégorie.</p>

      <ion-list v-else>
        <ion-item v-for="c in categories" :key="c.id">
          <ion-label>{{ c.libelle }}</ion-label>
          <ion-text v-for="r in recettes" :key="r.id">
            <p v-if="r.id_categorie == c.id">{{ r.libelle }}</p>
          </ion-text>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonList, IonItem, IonSpinner } from '@ionic/vue';
import type { Categorie, Ingredient, Recette } from '@/types/recette';
import { ref, onMounted } from 'vue';
import { getCategories } from '@/services/categorieService';
import ingredientService from '@/services/ingredientService';
import recetteService from '@/services/recetteService';

const categories = ref<Categorie[]>([]);
const erreur = ref<string | null>(null);
const chargement = ref(true);
const recettes = ref<Recette[] | null>(null);

async function charger() {
  chargement.value = true;
  erreur.value = null;
  try {
    categories.value = await getCategories();
    recettes.value = await recetteService.getRecettes();
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : String(e);
    console.error(e);
  } finally {
    chargement.value = false;
  }
}

onMounted(charger);
</script>

<style scoped>
.erreur {
  color: var(--ion-color-danger);
}
</style>
