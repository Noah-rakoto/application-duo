<template>
    <ion-page>
        <ion-tabs>
            <ion-router-outlet />

            <!-- La barre d'onglets, en bas de l'écran -->
            <!-- cachée sur le formulaire : son bouton « Enregistrer » prend la place -->
            <ion-tab-bar slot="bottom" :class="{ cachee: surFormulaire }">
                <ion-tab-button tab="recettes" href="/tabs/recettes" layout="icon-start">
                    <ion-icon :icon="restaurantOutline" />
                    <ion-label>Menu</ion-label>
                </ion-tab-button>

                <!-- Bouton central « + » (nouvelle recette), comme sur la maquette -->
                <ion-fab-button class="bouton-central" router-link="/tabs/recettes/nouvelle" aria-label="Nouvelle recette">
                    <ion-icon :icon="add" />
                </ion-fab-button>
            </ion-tab-bar>
        </ion-tabs>
    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge, IonFabButton } from '@ionic/vue';
import { restaurantOutline, add } from 'ionicons/icons';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const surFormulaire = computed(() => /\/(nouvelle|modifier)$/.test(route.path));
</script>

<style scoped src="../theme/pages/TabsPage.css"></style>
