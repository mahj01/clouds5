<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = ref(null)

onMounted(() => {
  const map = new maplibregl.Map({
    container: mapContainer.value,
    style: '/assets/style.json', // <-- offline tiles
    center: [47.5079, -18.8792],
    zoom: 12,
  })

  map.addControl(new maplibregl.NavigationControl())
})
</script>

<style>
.map-container {
  width: 100%;
  height: 100vh;
}
</style>
