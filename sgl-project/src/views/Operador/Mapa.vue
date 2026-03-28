<template>
  <div class="map-page-container">
    <div class="route-overlay">
      <div class="route-card">
        <div class="route-header">
          <span class="status-badge">En Ruta 🚛</span>
          <button @click="$router.push('/home')" class="btn-close">×</button>
        </div>
        <div class="route-body">
          <h3>Siguiente Parada</h3>
          <p class="store-name">Tienda Seleccionada</p>
          <div class="route-stats">
            <div class="stat">
              <span class="label">Distancia</span>
              <span class="value">4.2 km</span>
            </div>
            <div class="stat">
              <span class="label">Tiempo Est.</span>
              <span class="value">12 min</span>
            </div>
          </div>
        </div>
        <button class="btn-primary-action" @click="centrarRuta">
          Centrar Mapa 🎯
        </button>
      </div>
    </div>

    <main class="map-wrapper">
      <l-map 
        ref="mapObject" 
        v-model:zoom="zoom" 
        :center="center" 
        :use-global-leaflet="false"
        class="leaflet-map"
      >
        <l-tile-layer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          layer-type="base"
          name="CartoDB Voyager"
        ></l-tile-layer>

        <l-polyline 
          v-if="routePath.length" 
          :lat-lngs="routePath" 
          color="#3b82f6" 
          :weight="6"
          :opacity="0.8"
        />
      </l-map>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LPolyline } from "@vue-leaflet/vue-leaflet";
import { decode } from '@googlemaps/polyline-codec';
import axios from 'axios';

const mapObject = ref(null);
const zoom = ref(14);
const center = ref([21.1619, -86.8515]);
const routePath = ref([]);

const centrarRuta = () => {
  if (routePath.value.length > 0) {
    center.value = routePath.value[0];
  }
};

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/obtener-ultima-ruta');
    if (response.data?.ruta_polyline) {
      routePath.value = decode(response.data.ruta_polyline);
      center.value = routePath.value[0];
    }
  } catch (err) {
    console.error("Error:", err);
  }
});
</script>

<style scoped src="./Mapa.css"></style>