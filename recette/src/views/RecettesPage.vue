<template>
  <!-- ion-page : l'enveloppe obligatoire de chaque page -->
  <ion-page>
    <!-- Zone qui défile (en-tête compris, pour laisser la place aux recettes) -->
    <ion-content>
      <!-- Tirer vers le bas pour recharger -->
      <ion-refresher slot="fixed" @ionRefresh="rafraichir($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- En-tête -->
      <header class="entete">
        <p class="sur-titre">Bon appétit</p>
        <h1>Que cuisine-t-on<br />aujourd'hui ?</h1>
      </header>

      <ion-searchbar class="recherche" placeholder="Rechercher une recette" :debounce="250" v-model="rechercheLibelle"></ion-searchbar>

      <!-- Catégories en tuiles -->
      <ion-segment scrollable class="tuiles" v-model="idCategorie" @ion-change="charger">
        <ion-segment-button value="tous">
          <span class="tuile" aria-hidden="true"><ion-icon :icon="gridOutline" /></span>
          <ion-label>Toutes</ion-label>
        </ion-segment-button>
        <ion-segment-button v-for="c in categories" :key="c.id" :value="c.id">
          <span class="tuile" aria-hidden="true"><ion-icon :icon="iconeCategorie(c.libelle)" /></span>
          <ion-label>{{ c.libelle }}</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Filtre par ingrédient, présenté comme une carte -->
      <ion-select v-model="idIngredient" :multiple="true" label="Ingrédients" label-placement="stacked"
        class="filtre" interface="alert" :interface-options="{ header: 'Filtrer par ingrédient' }">
        <span slot="start" class="filtre-icone" aria-hidden="true"><ion-icon :icon="nutritionOutline" /></span>
        <ion-select-option value="tous">Tous</ion-select-option>
        <ion-select-option v-for="i in ingredients" :key="i.id" :value="i.id">
          {{ i.libelle }}
        </ion-select-option>
      </ion-select>

      <!-- 1. Chargement en cours -->
      <div v-if="chargement" class="etat">
        <ion-spinner name="dots" color="primary" />
      </div>

      <!-- 2. Erreur -->
      <div v-else-if="erreur" class="etat">
        <span class="etat-icone"><ion-icon :icon="alertCircleOutline" /></span>
        <p>{{ erreur }}</p>
        <ion-button color="secondary" @click="charger">Réessayer</ion-button>
      </div>

      <!-- 3. Liste vide -->
      <div v-else-if="recettes.length === 0" class="etat">
        <span class="etat-icone"><ion-icon :icon="bookOutline" /></span>
        <h3>Aucune recette pour le moment</h3>
        <p>Appuyez sur + pour créer la première.</p>
      </div>

      <!-- 3.1. Liste Filtree vide -->
      <div v-else-if="recettesFiltrees.length === 0 && recettes.length > 0" class="etat">
        <span class="etat-icone"><ion-icon :icon="searchOutline" /></span>
        <h3>Aucune recette ne correspond à votre recherche</h3>
        <ion-button color="secondary" @click="reinitialiserFiltres">Réinitialiser les filtres</ion-button>
      </div>

      <!-- 4. La liste des recettes -->
      <section v-else class="recettes">
        <!-- quantite de resultat -->
        <h2 class="titre-section">
          Recettes <span class="pastille">{{ recettesFiltrees.length }}</span>
        </h2>

        <!-- La première recette, mise en avant -->
        <ion-card class="vedette" button :router-link="`/tabs/recettes/${recettesFiltrees[0].id}`">
          <img v-if="recettesFiltrees[0].image" :src="recettesFiltrees[0].image" alt="" />
          <div v-else class="sans-image"><ion-icon :icon="iconeCategorie(libelleCategorie(recettesFiltrees[0]))" /></div>
          <div class="vedette-texte">
            <span class="puce">{{ libelleCategorie(recettesFiltrees[0]) }}</span>
            <h3>{{ recettesFiltrees[0].libelle }}</h3>
            <p>{{ formatDate(recettesFiltrees[0].date_creation) }}</p>
          </div>
        </ion-card>

        <!-- Les autres, en grille -->
        <div class="grille">
          <ion-card v-for="r in recettesFiltrees.slice(1)" :key="r.id" class="carte" button
            :router-link="`/tabs/recettes/${r.id}`">
            <img v-if="r.image" :src="r.image" alt="" />
            <div v-else class="sans-image"><ion-icon :icon="iconeCategorie(libelleCategorie(r))" /></div>
            <div class="carte-texte">
              <h3>{{ r.libelle }}</h3>
              <p class="categorie">{{ libelleCategorie(r) }}</p>
              <p class="date">{{ formatDate(r.date_creation) }}</p>
            </div>
          </ion-card>
        </div>
      </section>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  IonPage, IonContent, IonRefresher, IonRefresherContent,
  IonCard, IonLabel, IonSpinner, IonButton, IonIcon,
  onIonViewWillEnter, IonSearchbar, IonSegment, IonSelect, IonSelectOption, IonSegmentButton
} from '@ionic/vue';
import type { Categorie, Ingredient, Recette } from '@/types/recette';
import { getCategories } from '@/services/categorieService';
import recetteService from '@/services/recetteService';
import ingredientService from '@/services/ingredientService';
import { formatDate } from '../../utils/format';
import { normaliser, iconeCategorie } from '../../utils/format';
import { gridOutline, nutritionOutline, alertCircleOutline, bookOutline, searchOutline } from 'ionicons/icons';

const recettes = ref<Recette[]>([]);
const categories = ref<Categorie[]>([]);
const ingredients = ref<Ingredient[]>([]);
const chargement = ref(true);
const erreur = ref<string | null>(null);
const rechercheLibelle = ref<string>('');
const idCategorie = ref<string>('');
const idIngredient = ref<string[]>(['tous']);
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
    console.log(idIngredient.value)
  }
}

// Le refresher : on recharge, puis on lui dit de se refermer
async function rafraichir(event: CustomEvent) {
  await charger();
  (event.target as HTMLIonRefresherElement).complete();
}

function reinitialiserFiltres () {
  rechercheLibelle.value = '';  
  idCategorie.value = 'tous';
  idIngredient.value = ['tous'];
  
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
onIonViewWillEnter(() => {
  charger();
  idIngredient.value = ['tous'];
});
</script>

<style scoped src="../theme/pages/RecettesPage.css"></style>
