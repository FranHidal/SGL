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
        <div class="button-group">
          <button class="btn-primary-action" @click="centrarMapa">
            Destino 🎯
          </button>
          <button class="btn-secondary-action" @click="centrarEnMi">
            Mi Ubicación 📍
          </button>
        </div>
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
          v-for="(seg, idx) in segmentosVisibles" 
          :key="'seg-'+idx"
          :lat-lngs="seg.coords" 
          :color="'#3b82f6'" 
          :weight="6"
          :opacity="0.9"
        />

        <l-marker v-if="userLocation" :lat-lng="[userLocation.lat, userLocation.lng]">
          <l-icon
            icon-url="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
            :icon-size="[25, 41]"
            :icon-anchor="[12, 41]"
            class-name="gps-marker"
          />
          <l-popup>Estás aquí 🚛</l-popup>
        </l-marker>

        <l-marker 
          v-for="p in paradasAsignadas" 
          :key="p.id_tienda + '-' + esCompletada(p.id_tienda)" 
          :lat-lng="[parseFloat(p.latitud), parseFloat(p.longitud)]"
        >
          <l-icon 
            :icon-url="obtenerIcono(p)" 
            :icon-size="[25, 41]" 
            :icon-anchor="[12, 41]" 
            :popup-anchor="[1, -34]"
            :shadow-url="'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png'"
            :shadow-size="[41, 41]"
            :class-name="esCompletada(p.id_tienda) ? 'marker-done' : ''"
          />
          <l-popup>
            <div style="text-align: center;">
              <strong v-if="esCompletada(p.id_tienda)" style="color: #10b981;">✅ COMPLETADA</strong>
              <strong v-else-if="p.orden === 0" style="color: #3b82f6;">📍 ORIGEN</strong>
              <strong v-else-if="p.orden === 999" style="color: #3b82f6;">🏁 REGRESO</strong>
              <strong v-else style="color: #ef4444;">🛒 PARADA {{ p.orden }}</strong>
              <br>
              {{ p.nombre_tienda }}
            </div>
          </l-popup>
        </l-marker>
      </l-map>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LPolyline, LMarker, LPopup, LIcon } from "@vue-leaflet/vue-leaflet";
import axios from 'axios';

// --- CONFIGURACIÓN ICONOS ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ORIGEN_CARITAS = {
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
const userLocation = ref(null);
const watchId = ref(null);

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkMzRhMTZhOTczNjQ3NDViNTdmN2IzYjY1NDlhODlhIiwiaCI6Im11cm11cjY0In0='; 

// --- GEOLOCALIZACIÓN ---

const trackUbicacion = () => {
  if (!navigator.geolocation) return;

  watchId.value = navigator.geolocation.watchPosition(
    (pos) => {
      userLocation.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
    },
    (err) => console.warn("Error GPS:", err),
    { enableHighAccuracy: true }
  );
};

const centrarEnMi = () => {
  if (userLocation.value) {
    center.value = [userLocation.value.lat, userLocation.value.lng];
    zoom.value = 16;
  }
};

// --- LÓGICA DE NEGOCIO ---

const esCompletada = (id_tienda) => {
  if (!id_tienda || id_tienda === 0) return false;
  return paradasCompletadasIds.value.includes(id_tienda);
};

const obtenerIcono = (p) => {
  if (esCompletada(p.id_tienda)) return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
  if (p.orden === 0 || p.orden === 999) return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
  return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
};

const paradasFiltradas = computed(() => {
  return paradasAsignadas.value.filter(p => p.orden === 0 || p.orden === 999 || !esCompletada(p.id_tienda));
});

const segmentosVisibles = computed(() => {
  return segmentosRuta.value.filter(s => s && (s.id_destino === 999 || !esCompletada(s.id_destino)));
});

const siguienteParada = computed(() => {
  return paradasFiltradas.value.length > 1 ? paradasFiltradas.value[1] : paradasFiltradas.value[0] || {};
});

const centrarMapa = () => {
  if (siguienteParada.value.latitud) {
    center.value = [parseFloat(siguienteParada.value.latitud), parseFloat(siguienteParada.value.longitud)];
  }
};

const cargarRutaSegmentada = async (puntos) => {
  if (!puntos || puntos.length < 2) return;
  const tramos = [];
  for (let i = 0; i < puntos.length - 1; i++) {
    const origen = puntos[i];
    const destino = puntos[i + 1];
    try {
      const res = await axios.post('https://api.openrouteservice.org/v2/directions/driving-car/geojson', 
        { coordinates: [[parseFloat(origen.longitud), parseFloat(origen.latitud)], [parseFloat(destino.longitud), parseFloat(destino.latitud)]] },
        { headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' } }
      );
      if (res.data?.features?.length > 0) {
        tramos.push({ 
          id_destino: destino.orden === 999 ? 999 : (destino.id_tienda || 0),
          coords: res.data.features[0].geometry.coordinates.map(c => [c[1], c[0]]) 
        });
      }
    } catch (e) {
      tramos.push({ id_destino: destino.id_tienda || 0, coords: [[parseFloat(origen.latitud), parseFloat(origen.longitud)], [parseFloat(destino.latitud), parseFloat(destino.longitud)]] });
    }
  }
  segmentosRuta.value = tramos;
};

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;
  
  trackUbicacion(); // Iniciar GPS

  try {
    const resComp = await axios.get(`/operador/paradas-completadas/${user.id_colaborador}`);
    paradasCompletadasIds.value = resComp.data;
    const response = await axios.get(`/operador/mi-ruta/${user.id_colaborador}`);
    if (response.data?.length > 0) {
      const rutaConRegreso = [ORIGEN_CARITAS, ...response.data, { ...ORIGEN_CARITAS, orden: 999, nombre_tienda: "Regreso a Cáritas" }];
      paradasAsignadas.value = rutaConRegreso;
      await cargarRutaSegmentada(rutaConRegreso);
    }
  } catch (err) { console.error(err); }
});

onUnmounted(() => {
  if (watchId.value) navigator.geolocation.clearWatch(watchId.value);
});
</script>

<style scoped src="./Mapa.css"></style>
<style scoped>
:deep(.marker-done) {
  opacity: 0.3 !important;
  filter: grayscale(1) brightness(0.8);
}
.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.btn-secondary-action {
  flex: 1;
  background: white;
  border: 2px solid #3b82f6;
  color: #3b82f6;
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
:deep(.gps-marker) {
  filter: hue-rotate(140deg) brightness(1.2);
}
</style>