<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <!-- Retour vers la liste -->
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/recettes" />
        </ion-buttons>
        <ion-title>{{ enEdition ? 'Éditer la recette' : 'Nouvelle recette' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Chargement de la recette (mode édition) -->
      <div v-if="chargement" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <!-- Formulaire, affiché une fois la recette chargée -->
      <template v-else>
      <ion-input v-model="libelle" label="Libellé" label-placement="floating" fill="outline"
        :class="{ 'ion-invalid ion-touched': erreurs.libelle }" :error-text="erreurs.libelle" />

      <ion-select v-model="idCategorie" label="Catégorie" label-placement="floating" fill="outline"
        class="ion-margin-top">
        <ion-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.libelle }}</ion-select-option>
      </ion-select>
      <ion-note v-if="erreurs.categorie" color="danger">{{ erreurs.categorie }}</ion-note>

      <h2>Ingrédients</h2>
      <ion-item v-for="(ligne, index) in lignes" :key="index">
        <ion-input v-model="ligne.quantite" placeholder="500 g" />
        <ion-input v-model="ligne.libelle" placeholder="ingrédient" />
        <ion-button fill="clear" color="danger" @click="retirerLigne(index)">
          <ion-icon slot="icon-only" :icon="trashOutline" />
        </ion-button>
      </ion-item>
      <ion-note v-if="erreurs.ingredients" color="danger">{{ erreurs.ingredients }}</ion-note>
      <ion-button fill="outline" class="ion-margin-top" @click="ajouterLigne">+ Ajouter un ingrédient</ion-button>

      <ion-textarea v-model="preparation" label="Préparation" label-placement="floating" fill="outline"
        class="ion-margin-top" :auto-grow="true" :rows="5" :class="{ 'ion-invalid ion-touched': erreurs.preparation }"
        :error-text="erreurs.preparation" />

      <ion-textarea v-model="remarque" label="Remarque (facultative)" label-placement="floating" fill="outline"
        class="ion-margin-top" :auto-grow="true" :rows="3" />

      <ion-button expand="block" class="ion-margin-top" :disabled="envoiEnCours" @click="enregistrer">
        Enregistrer
      </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonInput, IonSelect, IonSelectOption, IonTextarea, IonItem, IonButton, IonIcon, IonNote,
  loadingController, toastController, useIonRouter,IonSpinner
} from '@ionic/vue';
import { trashOutline } from 'ionicons/icons';
import type { Categorie, NouvelleRecette } from '@/types/recette';
import { getCategories } from '@/services/categorieService';
import recetteService from '@/services/recetteService';
import { useRoute } from 'vue-router';

interface LigneFormulaire { libelle: string; quantite: string }

const ionRouter = useIonRouter();
const route = useRoute();

// mode : édition si l'URL contient un id (/tabs/recettes/:id/modifier), création sinon
const idRecette = route.params.id ? String(route.params.id) : null;
const enEdition = idRecette !== null;

const categories = ref<Categorie[]>([]);
const libelle = ref('');
const idCategorie = ref('');
const preparation = ref('');
const remarque = ref('');
const lignes = ref<LigneFormulaire[]>([{ libelle: '', quantite: '' }]);
const erreurs = ref<Record<string, string>>({});
const envoiEnCours = ref(false);
// le spinner ne s'affiche qu'en édition (en création il n'y a rien à charger)
const chargement = ref(enEdition);

function ajouterLigne() {
  lignes.value.push({ libelle: '', quantite: '' });
}

function retirerLigne(index: number) {
  lignes.value.splice(index, 1);
}

function valider(): boolean {
  erreurs.value = {};
  if (libelle.value.trim() === '') erreurs.value.libelle = 'Le libellé est obligatoire';
  if (idCategorie.value === '') erreurs.value.categorie = 'Choisissez une catégorie';
  const auMoinsUnIngredient = lignes.value.some((l) => l.libelle.trim() !== '');
  if (!auMoinsUnIngredient) erreurs.value.ingredients = 'Ajoutez au moins un ingrédient';
  if (preparation.value.trim() === '') erreurs.value.preparation = 'La préparation est obligatoire';
  return Object.keys(erreurs.value).length === 0;
}

async function enregistrer() {
  if (!valider()) return;
  const loading = await loadingController.create({ message: 'Enregistrement…' });
  await loading.present();
  envoiEnCours.value = true;

  try {
    const nouvelle: NouvelleRecette = {
      libelle: libelle.value,
      image: null,
      id_categorie: idCategorie.value,
      preparation: preparation.value,
      remarque: remarque.value,
      // les lignes entièrement vides ne sont pas envoyées au service
      ingredients: lignes.value
        .filter((l) => l.libelle.trim() !== '' || l.quantite.trim() !== '')
        .map((l) => ({ libelle: l.libelle, quantite: l.quantite })),
    };

    if (idRecette) {
      // édition : on met à jour la recette existante
      await recetteService.modifierRecette(idRecette, nouvelle);
    } else {
      // création : on crée une nouvelle recette
      const id = await recetteService.creerRecette(nouvelle);
      const toast = await toastController.create({ message: 'Recette enregistrée', duration: 2000, color: 'success' });
      await toast.present();
      ionRouter.navigate(`/tabs/recettes/${id}`, 'forward', 'replace');
      return;
    }

    const toast = await toastController.create({ message: 'Recette modifiée', duration: 2000, color: 'success' });
    await toast.present();
    // 'back' : on revient sur la page Détail déjà ouverte au lieu d'en empiler une deuxième
    ionRouter.navigate(`/tabs/recettes/${idRecette}`, 'back');
  } catch (e) {
    const toast = await toastController.create({
      message: e instanceof Error ? e.message : "Erreur lors de l'enregistrement",
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    console.error(e);
  } finally {
    envoiEnCours.value = false;
    await loading.dismiss();
  }
}
onMounted(async () => {
  try {
    categories.value = await getCategories();

    if (idRecette) {
      const recette = await recetteService.getRecette(idRecette);
      libelle.value = recette.libelle;
      idCategorie.value = recette.id_categorie;
      preparation.value = recette.preparation;
      remarque.value = recette.remarque ?? '';
      // on transforme les lignes de la recette ({ ingredient, quantite })
      // en lignes du formulaire ({ libelle, quantite })
      lignes.value = recette.lignes.map((l) => ({ libelle: l.ingredient.libelle, quantite: l.quantite }));
      // une recette sans ingrédient : on garde une ligne vide à remplir
      if (lignes.value.length === 0) lignes.value = [{ libelle: '', quantite: '' }];
    }
  } catch (e) {
    const toast = await toastController.create({
      message: e instanceof Error ? e.message : 'Erreur lors du chargement',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    console.error(e);
  } finally {
    chargement.value = false;
  }
});
</script>
