<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-titles">
        <h1>Dashboard Logístico</h1>
        <p>Resumen operativo - Cancún</p>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/director')" class="btn-back">
          Volver al Menú
        </button>
        <div class="date-badge">📅 {{ fechaActual }}</div>
      </div>
    </header>

    <main class="dashboard-content">
      
      <div v-if="cargando" class="loading-state">
        <p>Cargando información operativa en tiempo real...</p>
      </div>

      <template v-else>
        <section class="kpi-grid">
          <div class="kpi-card green">
            <div class="kpi-icon">📦</div>
            <div class="kpi-data">
              <h3>Carga Recolectada Hoy</h3>
              <p class="number">{{ Number(kpis.pesoHoy).toFixed(1) }} kg</p>
              <p class="status">Eficiencia de Visitas: {{ kpis.eficiencia }}%</p>
            </div>
          </div>
          
          <div class="kpi-card blue">
            <div class="kpi-icon">🏪</div>
            <div class="kpi-data">
              <h3>Catálogo de Tiendas</h3>
              <p class="number">{{ kpis.tiendasActivas }}</p>
              <p class="status">{{ kpis.tiendasMes }} con actividad últimos 30 días</p>
            </div>
          </div>

          <div class="kpi-card yellow">
            <div class="kpi-icon">🚛</div>
            <div class="kpi-data">
              <h3>Flota de Vehículos</h3>
              <p class="number">{{ kpis.vehiculosTotales }}</p>
              <p class="status">Unidades registradas en el CEDIS</p>
            </div>
          </div>

          <div class="kpi-card red">
            <div class="kpi-icon">👥</div>
            <div class="kpi-data">
              <h3>Personal de Operadores</h3>
              <p class="number">{{ kpis.operadoresActivos }}</p>
              <p class="status">{{ kpis.operadoresEnRuta }} asignados en ruta hoy</p>
            </div>
          </div>
        </section>

        <section class="details-grid">
          
          <div class="table-card">
            <h3>📍 Monitoreo de Itinerarios de Hoy</h3>
            <div class="table-wrapper">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>RutaID</th>
                    <th>Operador</th>
                    <th>Vehículo</th>
                    <th>Progreso de Visitas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="rutas.length === 0">
                    <td colspan="5" class="no-data">No se han generado rutas para el día de hoy.</td>
                  </tr>
                  <tr v-for="ruta in rutas" :key="ruta.id">
                    <td><strong>#{{ ruta.id }}</strong></td>
                    <td>{{ ruta.operador }}</td>
                    <td>{{ ruta.vehiculo }}</td>
                    <td>
                      <div class="progress-container">
                        <div class="progress-bar">
                          <div class="progress-fill" :style="{ width: ruta.progreso + '%' }"></div>
                        </div>
                        <span class="progress-text">{{ ruta.progreso }}%</span>
                      </div>
                    </td>
                    <td>
                      <span :class="['badge', getBadgeClass(ruta.estado)]">
                        {{ ruta.estado }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="chart-placeholder-card">
            <h3>🏬 Histórico de Carga por Cadena</h3>
            <div class="volume-list">
              <div v-if="cadenas.length === 0" class="no-data">Sin cargas registradas aún.</div>
              <div v-for="cadena in cadenas" :key="cadena.nombre" class="volume-item">
                <span class="cadena-nombre">{{ cadena.nombre }}</span>
                <div class="volume-bar-container">
                  <div class="volume-bar" :style="{ width: cadena.volumen + '%' }"></div>
                </div>
                <span class="volume-value">{{ Number(cadena.entregas).toFixed(1) }} Kg</span>
              </div>
            </div>
          </div>

        </section>
      </template>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const fechaActual = ref(new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
const cargando = ref(true);

// Inicialización de estados vacíos reactivos conectados a las propiedades
const kpis = reactive({
  pesoHoy: 0,
  eficiencia: 0,
  tiendasActivas: 0,
  tiendasMes: 0,
  vehiculosTotales: 0,
  operadoresActivos: 0,
  operadoresEnRuta: 0
});

const rutas = ref([]);
const cadenas = ref([]);

const cargarMetricasDashboard = async () => {
  try {
    cargando.value = true;
    const res = await axios.get('/dashboard-stats');
    
    // Asignación de KPIs globales
    Object.assign(kpis, res.data.kpis);
    
    // Listados de control operativo
    rutas.value = res.data.rutas;
    cadenas.value = res.data.cadenas;
  } catch (e) {
    console.error("Error al refrescar el dashboard:", e);
    alert("Ocurrió un error obteniendo los datos operativos en tiempo real.");
  } finally {
    cargando.value = false;
  }
};

const getBadgeClass = (estado) => {
  if (estado === 'Completada') return 'active'; // Verde
  if (estado === 'En Ruta') return 'warning';    // Amarillo
  if (estado === 'Pendiente') return 'muted';    // Gris o azul claro
  return '';
};

onMounted(() => {
  cargarMetricasDashboard();
});
</script>

<style scoped src="./Dashboard.css"></style>
<style scoped>
/* Ajustes cosméticos menores para la barra de progreso */
.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress-bar {
  flex: 1;
  background-color: #e2e8f0;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  background-color: #3b82f6;
  height: 100%;
  transition: width 0.4s ease;
}
.progress-text {
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 35px;
}
.no-data {
  padding: 20px;
  text-align: center;
  color: #64748b;
  font-style: italic;
}
.loading-state {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #475569;
}
.table-wrapper {
  overflow-x: auto;
}
.badge.muted {
  background-color: #f1f5f9;
  color: #475569;
}
</style>