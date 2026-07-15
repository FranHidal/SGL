<template>
  <div class="map-monitor-container">
    <header class="content-header">
      <h1>Monitoreo de Operadores y Rutas en Tiempo Real</h1>
      <p>Visualice la ubicación actual de las unidades y el trazado de sus rutas asignadas en Cancún.</p>
    </header>

    <div class="map-director-container">
      <!-- Barra lateral flotante con el estado de las rutas activas -->
      <div class="flota-overlay">
        <div class="flota-card">
          <div class="flota-header">
            <h3>Monitoreo de Flota 📡</h3>
            <span class="badge-total">{{ operadores.length }} Activos</span>
          </div>

          <div class="operadores-list-container">
            <div
              v-for="(op, idx) in operadores"
              :key="op.id_operador"
              class="operador-row-btn"
              @click="enfocarOperador(op)"
            >
              <span class="color-indicator" :style="{ backgroundColor: obtenerColorRuta(idx) }"></span>
              <div class="op-row-info">
                <strong>{{ op.nombre }} {{ op.primer_apellido }}</strong>
                <span class="text-xs text-muted">Unidad: {{ op.matricula || 'Sin Asignar' }}</span>
                <span class="text-xs text-muted">Última actualización: {{ formatearHora(op.ultima_conexion) }}</span>
              </div>
              <span class="badge-status-dot"></span>
            </div>
            <div v-if="operadores.length === 0" class="empty-text">
              No hay operadores reportando ubicación hoy.
            </div>
          </div>

          <label class="toggle-rutas">
            <input type="checkbox" v-model="mostrarRutas" />
            Mostrar rutas y paradas
          </label>
        </div>
      </div>

      <!-- Contenedor del Mapa Leaflet -->
      <main class="map-wrapper">
        <l-map
          ref="mapRef"
          :zoom="zoom"
          :center="center"
          :use-global-leaflet="true"
          class="leaflet-map"
        >
          <l-tile-layer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            layer-type="base"
          ></l-tile-layer>

          <!-- Marcador del CEDIS central (Cáritas) -->
          <l-marker v-if="mostrarRutas" :lat-lng="[ORIGEN_CARITAS.latitud, ORIGEN_CARITAS.longitud]">
            <l-icon
              icon-url="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png"
              :icon-size="[30, 48]"
              :icon-anchor="[15, 48]"
            />
            <l-popup>
              <strong>📍 {{ ORIGEN_CARITAS.nombre_tienda }}</strong><br>Centro de Distribución Principal
            </l-popup>
          </l-marker>

          <template v-for="(op, idx) in operadores" :key="'grupo-op-' + op.id_operador">
            <!-- Trazados de la ruta (opcional, según toggle) -->
            <template v-if="mostrarRutas">
              <l-polyline
                v-for="(seg, sIdx) in rutasMap[op.id_operador]?.segmentos || []"
                :key="'seg-' + op.id_operador + '-' + sIdx"
                :lat-lngs="seg.coords"
                :color="obtenerColorRuta(idx)"
                :weight="5"
                :opacity="0.85"
              />

              <!-- Tiendas asignadas en su itinerario -->
              <l-marker
                v-for="p in rutasMap[op.id_operador]?.paradas || []"
                :key="'tienda-' + op.id_operador + '-' + p.id_tienda"
                :lat-lng="[parseFloat(p.latitud), parseFloat(p.longitud)]"
              >
                <l-icon
                  :icon-url="obtenerIconoTienda(p.id_tienda, op.id_operador)"
                  :icon-size="[22, 36]"
                  :icon-anchor="[11, 36]"
                />
                <l-popup>
                  <div class="popup-content">
                    <strong style="color: #4a5568;">🛒 {{ p.nombre_tienda }}</strong><br>
                    <span class="text-xs">Cadena: {{ p.nombre_cadena }}</span><br>
                    <span class="badge-popup-orden" :style="{ backgroundColor: obtenerColorRuta(idx) }">
                      Parada #{{ p.orden }}
                    </span>
                    <span v-if="esParadaCompletada(p.id_tienda, op.id_operador)" class="status-done-text">
                      (Entregado ✅)
                    </span>
                  </div>
                </l-popup>
              </l-marker>
            </template>

            <!-- Ubicación del camión del operador en tiempo real (siempre visible) -->
            <l-marker
              v-if="op.latitud_actual && op.longitud_actual"
              :key="'gps-' + op.id_operador"
              :lat-lng="[parseFloat(op.latitud_actual), parseFloat(op.longitud_actual)]"
            >
              <l-icon
                icon-url="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
                :icon-size="[26, 42]"
                :icon-anchor="[13, 42]"
                class-name="operator-moving-marker"
              />
              <l-popup>
                <div class="popup-content">
                  <strong>🚛 Operador: {{ op.nombre }} {{ op.primer_apellido }}</strong><br>
                  <span>Placas / Unidad: {{ op.matricula || 'N/A' }}</span><br>
                  <span class="text-xs text-muted">Último reporte: {{ formatearHora(op.ultima_conexion) }}</span>
                </div>
              </l-popup>
            </l-marker>
          </template>
        </l-map>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LPolyline, LMarker, LPopup, LIcon } from "@vue-leaflet/vue-leaflet";
import axios from 'axios';

// ---- Configuración general ----
const ORIGEN_CARITAS = {
  nombre_tienda: "Cáritas Quintana Roo (CEDIS)",
  latitud: 21.212901,
  longitud: -86.842403
};

// IMPORTANTE: mueve esta key a una variable de entorno (.env) en lugar de dejarla hardcodeada en el frontend.
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkMzRhMTZhOTczNjQ3NDViNTdmN2IzYjY1NDlhODlhIiwiaCI6Im11cm11cjY0In0=';

const COLORES_RUTAS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
const obtenerColorRuta = (index) => COLORES_RUTAS[index % COLORES_RUTAS.length];

// ---- Estado del mapa ----
const zoom = ref(12);
const center = ref([21.1619, -86.8515]); // Centrado en Cancún
const mapRef = ref(null);
const mostrarRutas = ref(true); // Toggle: ver operadores solos o con rutas/paradas

// ---- Estado de datos ----
const operadores = ref([]);
const rutasMap = ref({}); // Indexado por id_operador
const intervalId = ref(null);

// ---- Carga de datos ----
const fetchFlotaYCoordenadas = async () => {
  try {
    // Endpoint único que ya incluye ubicación + info del operador (superset del monitoreo simple)
    const resFlota = await axios.get('/admin/ubicacion-operadores-dashboard');
    operadores.value = resFlota.data.filter(op => op.latitud_actual && op.longitud_actual);

    for (const op of operadores.value) {
      if (!rutasMap.value[op.id_operador]) {
        await cargarItinerarioOperador(op);
      } else {
        const resComp = await axios.get(`/operador/paradas-completadas/${op.id_colaborador}`);
        rutasMap.value[op.id_operador].completadas = resComp.data;
        rutasMap.value = { ...rutasMap.value };
      }
    }
  } catch (err) {
    console.error("Error actualizando coordenadas de la flota:", err);
  }
};

const cargarItinerarioOperador = async (op) => {
  try {
    const [resRuta, resComp] = await Promise.all([
      axios.get(`/admin/monitoreo-ruta/${op.id_colaborador}`),
      axios.get(`/operador/paradas-completadas/${op.id_colaborador}`)
    ]);

    if (resRuta.data && resRuta.data.length > 0) {
      const paradasAsignadas = resRuta.data;

      const puntosRuta = [
        { ...ORIGEN_CARITAS, id_tienda: 0, orden: 0 },
        ...paradasAsignadas,
        { ...ORIGEN_CARITAS, id_tienda: 9999, orden: 999, nombre_tienda: "Regreso a Cáritas" }
      ];

      rutasMap.value[op.id_operador] = {
        paradas: paradasAsignadas,
        completadas: resComp.data || [],
        segmentos: []
      };
      rutasMap.value = { ...rutasMap.value };
      await generarTramosCalles(op.id_operador, puntosRuta);
    } else {
      // El operador no tiene ruta asignada hoy; igual queda registrado para mostrar su GPS
      rutasMap.value[op.id_operador] = { paradas: [], completadas: [], segmentos: [] };
      rutasMap.value = { ...rutasMap.value };
    }
  } catch (err) {
    console.error(`Error procesando ruta de operador ${op.id_operador}:`, err);
  }
};

const generarTramosCalles = async (id_operador, puntos) => {
  const tramos = [];
  for (let i = 0; i < puntos.length - 1; i++) {
    const origen = puntos[i];
    const destino = puntos[i + 1];
    try {
      const res = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        { coordinates: [[parseFloat(origen.longitud), parseFloat(origen.latitud)], [parseFloat(destino.longitud), parseFloat(destino.latitud)]] },
        { headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' } }
      );
      if (res.data?.features?.length > 0) {
        tramos.push({
          id_destino: destino.id_tienda,
          coords: res.data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
        });
      }
    } catch (e) {
      // Fallback: línea recta si falla el servicio de ruteo
      tramos.push({
        id_destino: destino.id_tienda,
        coords: [
          [parseFloat(origen.latitud), parseFloat(origen.longitud)],
          [parseFloat(destino.latitud), parseFloat(destino.longitud)]
        ]
      });
    }
  }
  if (rutasMap.value[id_operador]) {
    rutasMap.value[id_operador].segmentos = tramos;
    rutasMap.value = { ...rutasMap.value };
  }
};

// ---- Helpers ----
const esParadaCompletada = (id_tienda, id_operador) => {
  return rutasMap.value[id_operador]?.completadas?.includes(id_tienda) || false;
};

const obtenerIconoTienda = (id_tienda, id_operador) => {
  if (esParadaCompletada(id_tienda, id_operador)) {
    return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
  }
  return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
};

const enfocarOperador = (op) => {
  if (op.latitud_actual && op.longitud_actual) {
    center.value = [parseFloat(op.latitud_actual), parseFloat(op.longitud_actual)];
    zoom.value = 15;
  }
};

const formatearHora = (timestamp) => {
  if (!timestamp) return 'Sin conexión';
  return new Date(timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

// ---- Ciclo de vida ----
onMounted(() => {
  fetchFlotaYCoordenadas();
  intervalId.value = setInterval(fetchFlotaYCoordenadas, 20000); // Un solo intervalo de actualización
});

onUnmounted(() => {
  if (intervalId.value) clearInterval(intervalId.value);
});
</script>

<style scoped>
.map-monitor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.content-header p {
  color: #64748b;
}
.map-director-container {
  position: relative;
  height: 70vh;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.map-wrapper {
  width: 100%;
  height: 100%;
}
.leaflet-map {
  height: 100% !important;
  width: 100% !important;
}
.flota-overlay {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 1000;
  width: 280px;
  pointer-events: none;
}
.flota-card {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  max-height: 420px;
  display: flex;
  flex-direction: column;
}
.flota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 8px;
}
.flota-header h3 {
  font-size: 0.95rem;
  margin: 0;
  color: #1e293b;
  font-weight: 700;
}
.badge-total {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: bold;
}
.operadores-list-container {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}
.operador-row-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}
.operador-row-btn:hover {
  background: #f8fafc;
  transform: translateX(2px);
  border-color: #cbd5e1;
}
.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.op-row-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.op-row-info strong {
  font-size: 0.85rem;
  color: #334155;
}
.text-xs { font-size: 0.75rem; }
.text-muted { color: #64748b; }
.badge-status-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}
.empty-text {
  text-align: center;
  font-size: 0.8rem;
  color: #94a3b8;
  padding: 15px 0;
  font-style: italic;
}
.toggle-rutas {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.8rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.popup-content {
  font-family: sans-serif;
  line-height: 1.4;
}
.badge-popup-orden {
  display: inline-block;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}
.status-done-text {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: bold;
}
:deep(.operator-moving-marker) {
  animation: marker-pulse 2s infinite ease-in-out;
}
@keyframes marker-pulse {
  0%   { filter: drop-shadow(0px 4px 6px rgba(59, 130, 246, 0.4)); }
  50%  { filter: drop-shadow(0px 4px 10px rgba(59, 130, 246, 0.75)); }
  100% { filter: drop-shadow(0px 4px 6px rgba(59, 130, 246, 0.4)); }
}
</style>