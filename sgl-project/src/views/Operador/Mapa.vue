<template>
  <div class="map-page-container">
    <div class="route-overlay">
      <div class="route-card" v-if="paradasFiltradas.length > 1 || (paradasFiltradas.length === 1 && paradasFiltradas[0].orden === 0)">
        <div class="route-header">
          <span class="status-badge">En Ruta 🚛</span>
          <button @click="$router.push('/home')" class="btn-close">×</button>
        </div>
        <div class="route-body">
          <h3 v-if="siguienteParada.orden === 0">Saliendo de:</h3>
          <h3 v-else>Siguiente Parada ({{ siguienteParada.orden }}):</h3>
          <p class="store-name">{{ siguienteParada.nombre_tienda || 'Cargando...' }}</p>
          
          <div class="route-stats">
            <div class="stat">
              <span class="label">Pendientes</span>
              <span class="value">{{ paradasFiltradas.length - 1 }}</span>
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
        <p style="text-align: center; padding: 20px; font-weight: bold;">
          ✅ ¡Ruta completada! <br> No hay más pendientes.
        </p>
        <button @click="$router.push('/home')" class="btn-primary-action">Volver al Inicio</button>
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
          v-for="p in paradasFiltradas" 
          :key="p.id_ruta_detalle || 'caritas-punto'" 
          :lat-lng="[parseFloat(p.latitud), parseFloat(p.longitud)]"
        >
          <l-icon 
            :icon-url="p.orden === 0 
              ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png' 
              : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'" 
            :icon-size="[25, 41]" 
            :icon-anchor="[12, 41]" 
            :popup-anchor="[1, -34]"
            :shadow-url="'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png'"
            :shadow-size="[41, 41]"
          />
          
          <l-popup>
            <div style="min-width: 150px;">
              <strong v-if="p.orden === 0" style="color: #3b82f6;">📍 CEDIS CÁRITAS</strong>
              <br>
              <span style="font-size: 0.9rem;">{{ p.nombre_tienda }}</span>
            </div>
          </l-popup>
        </l-marker>
      </l-map>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LPolyline, LMarker, LPopup, LIcon } from "@vue-leaflet/vue-leaflet";
import axios from 'axios';

// --- CONFIGURACIÓN DE ICONOS DEFAULT (FIX LEAFLET) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ORIGEN_CARITAS = {
  id_ruta_detalle: 0,
  id_tienda: 0, 
  nombre_tienda: "Cáritas Quintana Roo (CEDIS)",
  latitud: 21.212901,
  longitud: -86.842403,
  orden: 0
};

const zoom = ref(13);
const center = ref([21.1619, -86.8515]);
const paradasAsignadas = ref([]);
const paradasCompletadasIds = ref([]);
const segmentosRuta = ref([]);

const ORS_API_KEY = 'TU_KEY_DE_OPENROUTE_AQUI'; 
const paletaColores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const obtenerColor = (index) => paletaColores[index % paletaColores.length];

// Filtra las tiendas que aún no se han registrado en la bitácora hoy
const paradasFiltradas = computed(() => {
  if (paradasAsignadas.value.length === 0) return [];
  return paradasAsignadas.value.filter(p => 
    p.orden === 0 || !paradasCompletadasIds.value.includes(p.id_tienda)
  );
});

// Obtiene la primera parada pendiente después del origen
const siguienteParada = computed(() => {
  if (paradasFiltradas.value.length > 1) {
    return paradasFiltradas.value[1];
  }
  return paradasFiltradas.value[0] || {};
});

const centrarMapa = () => {
  const destino = siguienteParada.value;
  if (destino.latitud) {
    center.value = [parseFloat(destino.latitud), parseFloat(destino.longitud)];
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
        { coordinates: [[parseFloat(origen.longitud), parseFloat(origen.latitud)], [parseFloat(destino.longitud), parseFloat(destino.latitud)]] },
        { headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' } }
      );
      const geometry = response.data.features[0].geometry.coordinates;
      tramos.push({ coords: geometry.map(c => [c[1], c[0]]) });
    } catch (error) {
      // Fallback a línea recta si falla la API
      tramos.push({ coords: [[parseFloat(origen.latitud), parseFloat(origen.longitud)], [parseFloat(destino.latitud), parseFloat(destino.longitud)]] });
    }
  }
  segmentosRuta.value = tramos;
};

onMounted(async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);

  try {
    // 1. Cargar IDs de paradas ya visitadas
    const resComp = await axios.get(`http://localhost:3000/api/operador/paradas-completadas/${user.id_colaborador}`);
    paradasCompletadasIds.value = resComp.data;

    // 2. Cargar ruta completa asignada
    const response = await axios.get(`http://localhost:3000/api/operador/mi-ruta/${user.id_colaborador}`);
    
    if (response.data && response.data.length > 0) {
      const rutaCompleta = [ORIGEN_CARITAS, ...response.data];
      paradasAsignadas.value = rutaCompleta;
      
      // 3. Trazar solo los tramos pendientes
      await cargarRutaSegmentada(paradasFiltradas.value);
      
      // Foco inicial en el origen o la siguiente parada
      if (siguienteParada.value.latitud) {
        center.value = [parseFloat(siguienteParada.value.latitud), parseFloat(siguienteParada.value.longitud)];
      }
    }
  } catch (err) {
    console.error("Error al inicializar mapa:", err);
  }
});
</script>

<style scoped src="./Mapa.css"></style>