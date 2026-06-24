<template>
  <div class="reporte-container">
    <header class="reporte-header">
      <div class="header-main">
        <h2>Historial General de Bitácoras</h2>
        <p>Visualización unificada de recolecciones por folio de ticket</p>
      </div>
      <button @click="$router.push('/admin')" class="btn-panel">Volver al Panel</button>
    </header>

    <div class="filtros-bar">
      <div class="filtro-group buscador">
        <label>Buscar registro</label>
        <input 
          type="text" 
          v-model="busqueda" 
          placeholder="Buscar por folio, tienda u operador..." 
          class="input-filtro"
        />
      </div>
      
      <div class="filtro-group">
        <label>Fecha Inicio</label>
        <input type="date" v-model="fechaInicio" class="input-filtro" />
      </div>

      <div class="filtro-group">
        <label>Fecha Fin</label>
        <input type="date" v-model="fechaFin" class="input-filtro" />
      </div>

      <div class="filtro-group btn-limpiar-container">
        <button @click="limpiarFiltros" class="btn-limpiar" title="Restablecer filtros">
          Limpiar Filtros
        </button>
      </div>
    </div>

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
          <tr v-else-if="bitacorasFiltradas.length === 0">
            <td colspan="10" class="text-center text-muted">
              No se encontraron registros que coincidan con los filtros aplicados.
            </td>
          </tr>
          <tr v-for="b in bitacorasFiltradas" :key="b.folio + b.fecha">
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
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const bitacoras = ref([]);
const cargando = ref(true);

// Estados reactivos para los filtros
const busqueda = ref('');
const fechaInicio = ref('');
const fechaFin = ref('');

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

// PROPIEDAD COMPUTADA: Filtra el arreglo dinámicamente en memoria
const bitacorasFiltradas = computed(() => {
  return bitacoras.value.filter(b => {
    // 1. Filtro por Buscador de texto (Folio, Tienda, Cadena u Operador)
    const texto = busqueda.value.toLowerCase().trim();
    const coincideTexto = !texto || 
      b.folio?.toLowerCase().includes(texto) ||
      b.nombre_tienda?.toLowerCase().includes(texto) ||
      b.nombre_cadena?.toLowerCase().includes(texto) ||
      b.nombre_operador?.toLowerCase().includes(texto);

    // 2. Filtro por rango de fechas (Asegurando formatear la fecha correctamente)
    // El string de b.fecha suele venir como "2026-06-23T00:00:00.000Z", extraemos solo el "YYYY-MM-DD"
    const fechaRegistro = b.fecha ? b.fecha.split('T')[0] : '';
    
    const coincideFechaInicio = !fechaInicio.value || fechaRegistro >= fechaInicio.value;
    const coincideFechaFin = !fechaFin.value || fechaRegistro <= fechaFin.value;

    return coincideTexto && coincideFechaInicio && coincideFechaFin;
  });
});

const limpiarFiltros = () => {
  busqueda.value = '';
  fechaInicio.value = '';
  fechaFin.value = '';
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