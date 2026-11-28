<template>
  <!-- ion-page : l'enveloppe obligatoire de chaque page -->
  <ion-page>
    <!-- En-tête fixe en haut de l'écran -->
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Recettes</ion-title>
      </ion-toolbar>

      <ion-toolbar>
        <ion-searchbar :debounce="250" v-model="rechercheLibelle"></ion-searchbar>
      </ion-toolbar>

        <ion-segment scrollable v-model="idCategorie" @ion-change="charger">
          <ion-segment-button value="tous">
            <ion-label>Toutes</ion-label>
          </ion-segment-button>
          <ion-segment-button v-for="c in categories" :key="c.id" :value="c.id">
            <ion-label>{{ c.libelle }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-select v-model="idIngredient" label="Rechercher un ingredient" label-placement="floating" fill="outline"
        class="ion-margin-top">
          <ion-select-option :value="null">Tous</ion-select-option>
          <ion-select-option v-for="i in ingredients" :key="i.id" :value="i.id">
            {{ i.libelle }}
          </ion-select-option>
        </ion-select>
    </ion-header>

    <!-- Zone qui défile -->
    <ion-content>
      <!-- Tirer vers le bas pour recharger -->
      <ion-refresher slot="fixed" @ionRefresh="rafraichir($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- 1. Chargement en cours -->
      <div v-if="chargement" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <!-- 2. Erreur -->
      <div v-else-if="erreur" class="ion-padding">
        <ion-text color="danger">
          <p>{{ erreur }}</p>
        </ion-text>
        <ion-button expand="block" @click="charger">Réessayer</ion-button>
      </div>

      <!-- 3. Liste vide -->
      <div v-else-if="recettes.length === 0" class="ion-text-center ion-padding">
        <ion-text color="medium">
          <p>Aucune recette pour le moment</p>
        </ion-text>
      </div>

      <!-- 3.1. Liste Filtree vide -->
      <div v-else-if="recettesFiltrees.length === 0 && recettes.length > 0" class="ion-text-center ion-padding">
        <ion-text color="medium">
          <p>Aucune recette ne correspond à votre recherche</p>
          <ion-button @click="reinitialiserFiltres">Réinitialiser les filtres</ion-button>
        </ion-text>
      </div>

      <!-- 4. La liste des recettes -->
      <ion-list v-else>
        <ion-item v-for="r in recettesFiltrees" :key="r.id" :router-link="`/tabs/recettes/${r.id}`">
          <ion-thumbnail slot="start">
            <img v-if="r.image" :src="r.image" alt="" />
          </ion-thumbnail>
          <ion-label>
            <h2>{{ r.libelle }}</h2>
            <p>{{ libelleCategorie(r) }}</p>
            <p>{{ formatDate(r.date_creation) }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Bouton rond flottant « + », en bas à droite -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button router-link="/tabs/recettes/nouvelle">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonLabel, IonThumbnail, IonSpinner, IonText, IonButton, IonIcon,
  IonFab, IonFabButton, onIonViewWillEnter, IonSearchbar, IonSegment, IonSelect, IonSelectOption, IonSegmentButton
} from '@ionic/vue';
import { add } from 'ionicons/icons';
import type { Categorie, Ingredient, Recette } from '@/types/recette';
import { getCategories } from '@/services/categorieService';
import recetteService from '@/services/recetteService';
import ingredientService from '@/services/ingredientService';
import { formatDate } from '../../utils/format';
import { normaliser } from '../../utils/format';

const recettes = ref<Recette[]>([]);
const categories = ref<Categorie[]>([]);
const ingredients = ref<Ingredient[]>([]);
const chargement = ref(true);
const erreur = ref<string | null>(null);
const rechercheLibelle = ref<string>('');
const idCategorie = ref<string>('');
const idIngredient = ref<string | null>(null);
const idsRecettesAvecIngredient = ref<Set<string>>(new Set());

watch(idIngredient, async (newId) => {
  newId ? idsRecettesAvecIngredient.value = await recetteService.getIdsRecettesAvecIngredient(newId) : idsRecettesAvecIngredient.value = new Set();
})

// Retrouver la catégorie d'une recette (cours, partie 3)
const categoriesParId = computed(() => new Map(categories.value.map(c => [c.id, c])));
const recettesFiltrees = computed(() => {
  let resultat = recettes.value;

  if (rechercheLibelle.value !== '') {
    const terme = normaliser(rechercheLibelle.value);
    resultat = resultat.filter((r) => normaliser(r.libelle).includes(terme));
  }

  if (idIngredient.value !== null) {
    resultat = resultat.filter((r) => idsRecettesAvecIngredient.value.has(r.id));
  }

  return resultat;
});
function libelleCategorie(r: Recette): string {
  return categoriesParId.value.get(r.id_categorie)?.libelle ?? 'Sans catégorie';
}

// COMMENT charger les recettes
async function charger() {
  chargement.value = true;
  erreur.value = null;
  try {
    recettes.value = await recetteService.getRecettes(idCategorie.value);
    ingredients.value = await ingredientService.getIngredients();
  } catch (e) {
    erreur.value = 'Impossible de charger les recettes.';
    console.error(e);
  } finally {
    chargement.value = false;
  }
}

// Le refresher : on recharge, puis on lui dit de se refermer
async function rafraichir(event: CustomEvent) {
  await charger();
  (event.target as HTMLIonRefresherElement).complete();
}

function reinitialiserFiltres () {
  rechercheLibelle.value = '';  
  idCategorie.value = 'tous'
  idIngredient.value = null;
  
}

// QUAND charger :
// - les catégories ne changent pas : une seule fois
onMounted(async () => {
  try {
    categories.value = await getCategories();
  } catch (e) {
    console.error(e);
  }
});

// - les recettes : à chaque arrivée sur la page
onIonViewWillEnter(charger);
</script>
