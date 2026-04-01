<template>
  <div class="map-page-container">
    <div class="route-overlay">
      <div class="route-card" v-if="paradasOrdenadas.length > 0">
        <div class="route-header">
          <span class="status-badge">En Ruta 🚛</span>
          <button @click="$router.push('/home')" class="btn-close">×</button>
        </div>
        <div class="route-body">
          <h3>Siguiente Parada ({{ paradaActual.orden }})</h3>
          <p class="store-name">{{ paradaActual.nombre_tienda }}</p>
          
          <div class="route-stats">
            <div class="stat">
              <span class="label">Total Paradas</span>
              <span class="value">{{ paradasOrdenadas.length }}</span>
            </div>
            <div class="stat">
              <span class="label">Estatus IA</span>
              <span class="value" style="color: #10b981;">Optimizado ✅</span>
            </div>
          </div>
        </div>
        <button class="btn-primary-action" @click="centrarMapa">
          Centrar en Destino 🎯
        </button>
      </div>
      
      <div class="route-card" v-else>
        <p style="text-align: center; padding: 20px;">No tienes rutas asignadas para hoy.</p>
        <button @click="$router.push('/home')" class="btn-primary-action">Volver</button>
      </div>
    </div>

    <main class="map-wrapper">
      <l-map 
        ref="mapObject" 
        :zoom="zoom" 
        :center="center" 
        :use-global-leaflet="true"
        class="leaflet-map"
      >
        <l-tile-layer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          layer-type="base"
          name="CartoDB Voyager"
        ></l-tile-layer>

        <l-marker 
          v-for="p in paradasOrdenadas" 
          :key="p.id_ruta_detalle" 
          :lat-lng="[p.latitud, p.longitud]"
        >
          <l-popup>
            <strong>Parada {{ p.orden }}</strong><br>
            {{ p.nombre_tienda }}
          </l-popup>
        </l-marker>

        <l-polyline 
          v-if="routePath.length" 
          :lat-lngs="routePath" 
          color="#3b82f6" 
          :weight="5"
          :opacity="0.7"
        />
      </l-map>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import "leaflet/dist/leaflet.css";
// Nota: Importamos L para manejar iconos o ajustes manuales si es necesario
import L from 'leaflet';
import { LMap, LTileLayer, LPolyline, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import axios from 'axios';

const mapObject = ref(null);
const zoom = ref(13);
const center = ref([21.1619, -86.8515]); // Cancún Centro
const paradasOrdenadas = ref([]);
const routePath = ref([]);

// Computed para mostrar siempre la primera parada pendiente en la card
const paradaActual = computed(() => {
  return paradasOrdenadas.value[0] || {};
});

const centrarMapa = () => {
  if (paradasOrdenadas.value.length > 0) {
    center.value = [paradaActual.value.latitud, paradaActual.value.latitud];
  }
};

onMounted(async () => {
  // Obtenemos el ID del colaborador logueado
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;

  try {
    // Llamamos al nuevo endpoint que creamos en el server.js
    const response = await axios.get(`http://localhost:3000/api/operador/mi-ruta/${user.id_colaborador}`);
    
    if (response.data.length > 0) {
      paradasOrdenadas.value = response.data;
      
      // Creamos el camino (array de coordenadas) para la polilínea
      routePath.value = response.data.map(p => [p.latitud, p.longitud]);
      
      // Ajustamos el centro al primer punto de la ruta
      center.value = routePath.value[0];
    }
  } catch (err) {
    console.error("Error al cargar la ruta optimizada:", err);
  }
});
</script>

<style scoped src="./Mapa.css"></style>