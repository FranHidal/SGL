<template>
  <div class="reporte-container">
    <header class="reporte-header">
      <h2>Historial General de Bitácoras 📊</h2>
      <p>Visualización unificada de recolecciones por folio de ticket</p>
      <button @click="$router.push('/admin')" class="nav-item">Volver al Panel</button>
    </header>

    <div class="tabla-responsiva">
      <table class="tabla-bitacoras">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Folio</th>
            <th>Tienda / Cadena</th>
            <th>Operador</th>
            <th>Horarios</th>
            <th>Perecedero</th>
            <th>No Perecedero</th>
            <th>Bazar</th>
            <th>Total (kg)</th>
            <th>Comentarios</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="10" class="text-center text-muted">Cargando registros...</td>
          </tr>
          <tr v-else-if="bitacoras.length === 0">
            <td colspan="10" class="text-center text-muted">No se encontraron registros de bitácoras.</td>
          </tr>
          <tr v-for="b in bitacoras" :key="b.folio + b.fecha">
            <td><strong>{{ formatearFecha(b.fecha) }}</strong></td>
            <td><span class="badge-folio">{{ b.folio }}</span></td>
            <td>
              <div class="tienda-info">
                <span class="nombre-t">{{ b.nombre_tienda }}</span>
                <span class="nombre-c">{{ b.nombre_cadena }}</span>
              </div>
            </td>
            <td>{{ b.nombre_operador || 'No asignado' }}</td>
            <td class="text-sm">
              <div>Llegada: {{ b.hora_llegada }}</div>
              <div>Salida: {{ b.hora_salida }}</div>
            </td>
            <td class="text-right">{{ Number(b.total_perecedero || 0).toFixed(1) }} kg</td>
            <td class="text-right">{{ Number(b.total_no_perecedero || 0).toFixed(1) }} kg</td>
            <td class="text-right">{{ Number(b.total_bazar || 0).toFixed(1) }} kg</td>
            <td class="text-right total-destacado">
              <strong>{{ Number(b.peso_total_visita || 0).toFixed(1) }} kg</strong>
            </td>
            <td class="col-comentarios" :title="b.comentarios_combinados">
              {{ b.comentarios_combinados || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const bitacoras = ref([]);
const cargando = ref(true);

const obtenerReporte = async () => {
  try {
    const res = await axios.get('/global/reporte-bitacoras');
    bitacoras.value = res.data;
  } catch (e) {
    console.error("Error al obtener el reporte:", e);
    alert("No se pudieron cargar los datos de las bitácoras");
  } finally {
    cargando.value = false;
  }
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' };
  return new Date(fechaStr).toLocaleDateString('es-MX', opciones);
};

onMounted(() => {
  obtenerReporte();
});
</script>

<style scoped src="./TablaBitacoras.css"></style>