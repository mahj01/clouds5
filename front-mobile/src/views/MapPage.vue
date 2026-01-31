<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Offline Map</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div id="map" style="height: 100%;"></div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { onIonViewDidEnter, IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

let map: any;

onIonViewDidEnter(() => {
  map = new maplibregl.Map({
    container: 'map',
    style: 'http://127.0.0.1:8080/style.json',
    center: [47.5245, -18.8985],
    zoom: 12
  });
});
</script>

<style>
#map {
  width: 100%;
  height: 100%;
}
</style>
