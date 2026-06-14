<template>
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const historialRutas = ref([]);

const cargarHistorial = async () => {
  try {
    const resHist = await axios.get('/rutas/historial');
    historialRutas.value = resHist.data;
  } catch (err) {
    console.error("Error al cargar historial:", err);
  }
};

onMounted(cargarHistorial);

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
    const res = await axios.delete(`/rutas/${id}`);
    alert(res.data.message);
    cargarHistorial(); // Refrescar la tabla localmente
  } catch (err) {
    console.error(err);
    alert("No se pudo eliminar la ruta. Verifique si tiene registros en bitácora asociados.");
  }
};
</script>

<style scoped>
/* COMPONENTES DE ESTRUCTURA */
.content-header {
    margin-bottom: 30px;
}

.content-header h1 {
    font-size: 2rem;
    color: #0f172a;
}

.content-header p {
    color: #64748b;
    margin-top: 5px;
}

/* TABLA DE HISTORIAL */
.table-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table th {
    background: #f1f5f9;
    padding: 16px 12px;
    text-align: left;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
}

.admin-table td {
    padding: 16px 12px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.95rem;
    color: #1e293b;
    vertical-align: middle;
}

.admin-table tr:hover {
    background-color: #f8fafc;
}

/* BADGES (ESTADOS DE OPTIMIZACIÓN) */
.badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
}

.badge.warning { 
    background-color: #fef3c7; 
    color: #92400e; 
}

.badge.success { 
    background-color: #d1fae5; 
    color: #065f46; 
}

/* BOTÓN ELIMINAR */
.btn-delete-mini {
    background-color: #fee2e2;
    color: #ef4444;
    border: 1px solid #fca5a5;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.2s;
}

.btn-delete-mini:hover {
    background-color: #ef4444;
    color: white;
    transform: translateY(-1px);
}
</style>