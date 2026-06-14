<template>
  <div class="map-monitor-container">
    <header class="content-header">
      <h1>Monitoreo de Operadores en Tiempo Real</h1>
      <p>Visualice la ubicación actual de las unidades de transporte en Cancún.</p>
    </header>

    <div class="map-wrapper">
      <l-map 
        :zoom="zoom" 
        :center="center" 
        :use-global-leaflet="true"
        class="leaflet-map"
      >
        <l-tile-layer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          layer-type="base"
        ></l-tile-layer>

        <l-marker 
          v-for="op in operadoresActivos" 
          :key="op.id_operador" 
          :lat-lng="[parseFloat(op.latitud_actual), parseFloat(op.longitud_actual)]"
        >
          <l-icon 
            icon-url="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" 
            :icon-size="[25, 41]" 
            :icon-anchor="[12, 41]" 
            :popup-anchor="[1, -34]"
          />
          <l-popup>
            <div class="operator-popup">
              <strong>🚛 Operador:</strong> {{ op.nombre }} {{ op.primer_apellido }} <br>
              <strong>Matrícula:</strong> {{ op.matricula || 'Sin Unidad' }} <br>
              <strong>Última actualización:</strong> {{ formatearHora(op.ultima_conexion) }}
            </div>
          </l-popup>
        </l-marker>
      </l-map>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup, LIcon } from "@vue-leaflet/vue-leaflet";
import axios from 'axios';

const zoom = ref(12);
const center = ref([21.1619, -86.8515]); // Centrado en Cancún
const operadoresActivos = ref([]);
const intervaloMonitoreo = ref(null);

const consultarUbicaciones = async () => {
  try {
    // Petición al backend para obtener las coordenadas frescas de los operadores
    const res = await axios.get('/admin/ubicacion-operadores');
    // Filtramos solo los operadores que tengan coordenadas válidas registradas
    operadoresActivos.value = res.data.filter(op => op.latitud_actual && op.longitud_actual);
  } catch (err) {
    console.error("Error monitoreando operadores:", err);
  }
};

onMounted(() => {
  consultarUbicaciones();
  // Monitoreo en tiempo real: Actualiza cada 30 segundos automáticamente
  intervaloMonitoreo.value = setInterval(consultarUbicaciones, 30000);
});

onUnmounted(() => {
  if (intervaloMonitoreo.value) clearInterval(intervaloMonitoreo.value);
});

const formatearHora = (fechaRaw) => {
  if (!fechaRaw) return 'N/A';
  return new Date(fechaRaw).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.map-monitor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.map-wrapper {
  width: 100%;
  height: 650px; /* Mapa amplio para el Administrador */
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
}
.leaflet-map {
  width: 100%;
  height: 100%;
}
.operator-popup {
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>