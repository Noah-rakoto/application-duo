<template>
    <ion-page>
        <ion-tabs>
            <ion-router-outlet />

            <!-- La barre d'onglets, en bas de l'écran -->
            <ion-tab-bar slot="bottom">
                <ion-tab-button tab="menu" href="/tabs/menu">
                    <ion-icon :icon="restaurantOutline" />
                    <ion-label>Menu</ion-label>
                </ion-tab-button>
            </ion-tab-bar>
        </ion-tabs>
    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/vue';
import { restaurantOutline } from 'ionicons/icons';
</script>
