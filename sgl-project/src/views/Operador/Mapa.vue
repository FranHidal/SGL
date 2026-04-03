<template>
  <div class="map-page-container">
    <div class="route-overlay">
      <div class="route-card" v-if="paradasAsignadas.length > 0">
        <div class="route-header">
          <span class="status-badge">En Ruta 🚛</span>
          <button @click="$router.push('/home')" class="btn-close">×</button>
        </div>
        <div class="route-body">
          <h3 v-if="paradaActual.orden === 0">Saliendo de:</h3>
          <h3 v-else>Siguiente Parada ({{ paradaActual.orden }}):</h3>
          <p class="store-name">{{ paradaActual.nombre_tienda }}</p>
          
          <div class="route-stats">
            <div class="stat">
              <span class="label">Tramos</span>
              <span class="value">{{ segmentosRuta.length }}</span>
            </div>
            <div class="stat">
              <span class="label">Origen</span>
              <span class="value" style="color: #3b82f6;">Cáritas 📍</span>
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
        ></l-tile-layer>

        <l-polyline 
          v-for="(segmento, index) in segmentosRuta" 
          :key="'seg-'+index"
          :lat-lngs="segmento.coords" 
          :color="obtenerColor(index)" 
          :weight="6"
          :opacity="0.9"
        />

        <l-marker 
          v-for="p in paradasAsignadas" 
          :key="p.id_ruta_detalle || 'caritas-punto'" 
          :lat-lng="[parseFloat(p.latitud), parseFloat(p.longitud)]"
        >
          <l-popup>
            <strong v-if="p.orden === 0">PUNTO DE ORIGEN:</strong>
            <strong v-else>PARADA {{ p.orden }}:</strong><br>
            {{ p.nombre_tienda }}
          </l-popup>
        </l-marker>
      </l-map>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LPolyline, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import axios from 'axios';

// --- CONFIGURACIÓN DE ORIGEN ---
const ORIGEN_CARITAS = {
  id_ruta_detalle: 0, // ID ficticio para el loop
  nombre_tienda: "Cáritas Quintana Roo (CEDIS)",
  latitud: 21.212901,  // Coordenada usada en tu VSP.py
  longitud: -86.842403, // Coordenada usada en tu VSP.py
  orden: 0
};

const zoom = ref(13);
const center = ref([21.1619, -86.8515]);
const paradasAsignadas = ref([]);
const segmentosRuta = ref([]);

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkMzRhMTZhOTczNjQ3NDViNTdmN2IzYjY1NDlhODlhIiwiaCI6Im11cm11cjY0In0=';
const paletaColores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const obtenerColor = (index) => paletaColores[index % paletaColores.length];

const paradaActual = computed(() => paradasAsignadas.value[0] || {});

const centrarMapa = () => {
  if (paradaActual.value.latitud) {
    center.value = [parseFloat(paradaActual.value.latitud), parseFloat(paradaActual.value.longitud)];
  }
};

const cargarRutaSegmentada = async (puntos) => {
  const tramos = [];
  for (let i = 0; i < puntos.length - 1; i++) {
    const origen = puntos[i];
    const destino = puntos[i + 1];

    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        { 
          coordinates: [
            [parseFloat(origen.longitud), parseFloat(origen.latitud)], 
            [parseFloat(destino.longitud), parseFloat(destino.latitud)]
          ] 
        },
        { headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' } }
      );

      const geometry = response.data.features[0].geometry.coordinates;
      tramos.push({ coords: geometry.map(c => [c[1], c[0]]) });
    } catch (error) {
      console.error("Error en tramo:", error);
      // Fallback a línea recta
      tramos.push({
        coords: [
          [parseFloat(origen.latitud), parseFloat(origen.longitud)],
          [parseFloat(destino.latitud), parseFloat(destino.longitud)]
        ]
      });
    }
  }
  segmentosRuta.value = tramos;
};

onMounted(async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);

  try {
    const response = await axios.get(`http://localhost:3000/api/operador/mi-ruta/${user.id_colaborador}`);
    
    if (response.data && response.data.length > 0) {
      // Unimos Cáritas con las paradas de la BD
      const rutaConOrigen = [ORIGEN_CARITAS, ...response.data];
      paradasAsignadas.value = rutaConOrigen;
      
      // Centramos en Cáritas para empezar
      center.value = [ORIGEN_CARITAS.latitud, ORIGEN_CARITAS.longitud];
      
      // Trazamos los trayectos reales
      await cargarRutaSegmentada(rutaConOrigen);
    }
  } catch (err) {
    console.error("Error cargando la ruta:", err);
  }
});
</script>

<style scoped src="./Mapa.css"></style>