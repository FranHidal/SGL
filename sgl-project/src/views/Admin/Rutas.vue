<template>
  <div class="gestion-container">
    <aside class="admin-menu">
      <h2>Logística VSP 🚀</h2>
      <nav>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'planificador' }"
          @click="tabActual = 'planificador'"
        >
          Planificador de Rutas
        </button>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'historial' }"
          @click="tabActual = 'historial'"
        >
          Rutas Creadas
        </button>

        <div class="menu-footer">
          <button @click="$router.push('/admin')" class="nav-item">Panel Principal</button>
        </div>
      </nav>
    </aside>

    <main class="gestion-content">
      <div v-if="tabActual === 'planificador'">
        <header class="content-header">
          <h1>Planificación de Rutas</h1>
          <p>Seleccione al operador y las sucursales para crear el itinerario de hoy.</p>
        </header>

        <div class="form-grid">
          <div class="form-card">
            <h3>1. Seleccionar Operador</h3>
            <div class="form-group">
              <select v-model="plan.id_operador" class="admin-select">
                <option :value="null" disabled>-- Seleccione un Operador --</option>
                <option v-for="op in operadores" :key="op.id_operador" :value="op.id_operador">
                  👤 {{ op.nombre }} {{ op.primer_apellido }} | [{{ op.matricula || 'Sin Unidad' }}]
                </option>
              </select>
            </div>
          </div>

          <div class="form-card" style="grid-column: span 2;">
            <h3>2. Tiendas disponibles en Cancún</h3>
            <div class="table-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>📍</th>
                    <th>Tienda</th>
                    <th>Cadena</th>
                    <th>Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in tiendas" :key="t.id_tienda">
                    <td>
                      <input type="checkbox" :value="t.id_tienda" v-model="plan.seleccionadas" />
                    </td>
                    <td><strong>{{ t.nombre_tienda }}</strong></td>
                    <td><span class="badge info">{{ t.nombre_cadena }}</span></td>
                    <td>{{ t.direccion }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="action-bar">
              <span>{{ plan.seleccionadas.length }} paradas marcadas</span>
              <button 
                @click="crearRuta" 
                class="btn-save" 
                :disabled="!plan.id_operador || plan.seleccionadas.length === 0"
              >
                Generar Itinerario 🚛
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="tabActual === 'historial'">
        <header class="content-header">
          <h1>Rutas Activas e Historial</h1>
          <p>Listado de itinerarios generados y su estado de optimización.</p>
        </header>

        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Operador</th>
                <th>Itinerario (Orden de visita)</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ruta in historialRutas" :key="ruta.id_ruta">
                <td>#{{ ruta.id_ruta }}</td>
                <td>{{ formatearFecha(ruta.fecha_creacion) }}</td>
                <td><strong>{{ ruta.nombre_operador }} {{ ruta.primer_apellido }}</strong></td>
                <td class="itinerario-text">{{ ruta.itinerario }}</td>
                <td>
                  <span :class="['badge', ruta.optimizada ? 'success' : 'warning']">
                    {{ ruta.optimizada ? 'Optimizado' : 'Pendiente' }}
                  </span>
                </td>
                <td>
                  <button @click="eliminarRuta(ruta.id_ruta)" class="btn-delete-mini">
                    Eliminar 🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue';
import axios from 'axios';

const tabActual = ref('planificador');
const operadores = ref([]);
const tiendas = ref([]);
const historialRutas = ref([]);

const plan = reactive({
  id_operador: null,
  seleccionadas: []
});

const cargarDatos = async () => {
  const [resOp, resTiendas, resHist] = await Promise.all([
    axios.get('http://localhost:3000/api/operadores-unidades'),
    axios.get('http://localhost:3000/api/tiendas'),
    axios.get('http://localhost:3000/api/rutas/historial')
  ]);
  operadores.value = resOp.data;
  tiendas.value = resTiendas.data;
  historialRutas.value = resHist.data;
};

onMounted(cargarDatos);

// Recargar historial cada vez que cambiemos a esa pestaña
watch(tabActual, (newTab) => {
  if (newTab === 'historial') cargarDatos();
});

const crearRuta = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/rutas/generar', {
      id_operador: plan.id_operador,
      tiendas: plan.seleccionadas
    });
    alert(res.data.message);
    plan.seleccionadas = [];
    plan.id_operador = null;
    cargarDatos(); // Refrescar historial
    tabActual.value = 'historial'; // Mover al historial para ver el resultado
  } catch (err) {
    alert("Error al guardar la ruta");
  }
};

const formatearFecha = (fechaRaw) => {
  return new Date(fechaRaw).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const eliminarRuta = async (id) => {
  if (!confirm(`¿Está seguro de eliminar la Ruta #${id}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const res = await axios.delete(`http://localhost:3000/api/rutas/${id}`);
    alert(res.data.message);
    cargarDatos(); // Recargamos la tabla para que desaparezca la ruta
  } catch (err) {
    console.error(err);
    alert("No se pudo eliminar la ruta. Verifique si tiene registros en bitácora asociados.");
  }
};
</script>

<style scoped>
.itinerario-text {
  font-size: 0.85rem;
  color: #4b5563;
  max-width: 400px;
  line-height: 1.4;
}
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.success { background: #d1fae5; color: #065f46; }
</style>

<style src="./Rutas.css"></style>