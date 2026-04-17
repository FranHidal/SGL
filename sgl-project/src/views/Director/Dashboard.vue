<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-titles">
        <h1>Dashboard Logístico 📊</h1>
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
      
      <section class="kpi-grid">
        <div class="kpi-card green">
          <div class="kpi-icon">🚚</div>
          <div class="kpi-data">
            <h3>Recolecciones Hoy</h3>
            <p class="number">{{ mockKpis.entregasHoy }}</p>
            <p class="status">Eficiencia: {{ mockKpis.eficiencia }}%</p>
          </div>
        </div>
        
        <div class="kpi-card blue">
          <div class="kpi-icon">🏪</div>
          <div class="kpi-data">
            <h3>Tiendas Activas</h3>
            <p class="number">{{ mockKpis.tiendasActivas }}</p>
            <p class="status">{{ mockKpis.sucursalesNuevas }} nuevas este mes</p>
          </div>
        </div>

        <div class="kpi-card yellow">
          <div class="kpi-icon">🛠️</div>
          <div class="kpi-data">
            <h3>Flota en Taller</h3>
            <p class="number">{{ mockKpis.vehiculosTaller }}</p>
            <p class="status">{{ mockKpis.vehiculosOperativos }} unidades activas</p>
          </div>
        </div>

        <div class="kpi-card red">
          <div class="kpi-icon">👥</div>
          <div class="kpi-data">
            <h3>Operadores</h3>
            <p class="number">{{ mockKpis.operadoresActivos }}</p>
            <p class="status">{{ mockKpis.operadoresEnRuta }} en ruta ahora</p>
          </div>
        </div>
      </section>

      <section class="details-grid">
        
        <div class="table-card">
          <h3>📍 Monitoreo de Rutas Activas</h3>
          <table class="admin-table">
            <thead>
              <tr>
                <th>RutaID</th>
                <th>Operador</th>
                <th>Vehículo</th>
                <th>Progreso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ruta in mockRutas" :key="ruta.id">
                <td>#{{ ruta.id }}</td>
                <td>{{ ruta.operador }}</td>
                <td>{{ ruta.vehiculo }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: ruta.progreso + '%' }"></div>
                  </div>
                  {{ ruta.progreso }}%
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

        <div class="chart-placeholder-card">
          <h3>🏬 Volumen de Carga por Cadena</h3>
          <div class="volume-list">
            <div v-for="cadena in mockCadenas" :key="cadena.nombre" class="volume-item">
              <span class="cadena-nombre">{{ cadena.nombre }}</span>
              <div class="volume-bar-container">
                <div class="volume-bar" :style="{ width: cadena.volumen + '%' }"></div>
              </div>
              <span class="volume-value">{{ cadena.entregas }} envíos</span>
            </div>
          </div>
        </div>

      </section>

    </main>
  </div>
</template>

<script setup>
// Busca la línea 116 aproximadamente y cámbiala por esta:
import { ref, reactive } from 'vue';

const fechaActual = ref(new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

// ==============================
// DATOS PRUEBA (MOCK DATA)
// ==============================

const mockKpis = reactive({
  entregasHoy: 145,
  eficiencia: 98.2,
  tiendasActivas: 32,
  sucursalesNuevas: 3,
  vehiculosTaller: 2,
  vehiculosOperativos: 14,
  operadoresActivos: 16,
  operadoresEnRuta: 12
});

const mockRutas = ref([
  { id: 101, operador: 'Juan Pérez', vehiculo: 'Nissan (TS-123)', progreso: 85, estado: 'En Ruta' },
  { id: 102, operador: 'Ana Gómez', vehiculo: 'Ford (TS-456)', progreso: 100, estado: 'Completada' },
  { id: 103, operador: 'Carlos Díaz', vehiculo: 'Isuzu (TS-789)', progreso: 45, estado: 'En Ruta' },
  { id: 104, operador: 'Luis Torres', vehiculo: 'Nissan (TS-012)', progreso: 10, estado: 'Retrasada' }
]);

const mockCadenas = ref([
  { nombre: 'Oxxo', entregas: 65, volumen: 80 },
  { nombre: '7-Eleven', entregas: 42, volumen: 60 },
  { nombre: 'Chedraui', entregas: 28, volumen: 45 },
  { nombre: 'Walmart', entregas: 10, volumen: 20 }
]);

// Lógica visual para los badges de la tabla
const getBadgeClass = (estado) => {
  if (estado === 'Completada') return 'active'; // Verde
  if (estado === 'En Ruta') return 'warning'; // Amarillo
  if (estado === 'Retrasada') return 'danger'; // Rojo
  return '';
};
</script>

<style scoped src="./Dashboard.css"></style>