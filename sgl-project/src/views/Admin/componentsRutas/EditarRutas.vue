<template>
  <div class="edit-rutas-wrapper">
    <div class="section-title-container">
      <h3>🗺️ Modificación de Rutas Activas (Hoy)</h3>
      <p>Añade o remueve paradas de las rutas generadas hoy. Al guardar, el optimizador de IA recalculará el orden.</p>
    </div>

    <!-- Selector de Ruta Activa -->
    <div class="route-selector-zone">
      <div class="form-group">
        <label>Selecciona una Ruta Activa</label>
        <select v-model="idRutaSeleccionada" @change="cargarDetalleRuta" class="main-select">
          <option :value="null" disabled>-- Selecciona la ruta a modificar --</option>
          <option v-for="r in rutasHoy" :key="r.id_ruta" :value="r.id_ruta">
            Ruta #{{ r.id_ruta }} - Operador: {{ r.nombre_operador }} {{ r.primer_apellido }} [{{ r.optimizada ? 'Optimizada' : 'Pendiente' }}]
          </option>
        </select>
      </div>
    </div>

    <div v-if="idRutaSeleccionada" class="editing-grid">
      <!-- PANEL IZQUIERDO: ITINERARIO ACTUAL -->
      <div class="panel-itinerario">
        <h4>Paradas de la Ruta Actual</h4>
        <ul class="paradas-list">
          <li v-for="(p, index) in paradasActuales" :key="p.id_ruta_detalle" class="parada-item">
            <span class="badge-orden">{{ index + 1 }}</span>
            <div class="parada-info">
              <strong>{{ p.nombre_tienda }}</strong>
              <span class="cadena-text">{{ p.nombre_cadena }}</span>
            </div>
            <button @click="removerTienda(index)" class="btn-remove-stop" title="Quitar parada">❌</button>
          </li>
          <li v-if="paradasActuales.length === 0" class="empty-state">
            La ruta no tiene paradas asignadas.
          </li>
        </ul>
      </div>

      <!-- PANEL DERECHO: AGREGAR NUEVAS TIENDAS -->
      <div class="panel-agregar">
        <h4>Añadir Punto a la Ruta</h4>
        <div class="add-zone">
          <label>Buscar / Seleccionar Tienda disponible</label>
          <select v-model="idTiendaNueva" class="table-select">
            <option :value="null" disabled>-- Seleccione una tienda --</option>
            <option v-for="t in todasLasTiendas" :key="t.id_tienda" :value="t.id_tienda" :disabled="estaTiendaEnRuta(t.id_tienda)">
              {{ t.nombre_tienda }} ({{ t.nombre_cadena }}) {{ estaTiendaEnRuta(t.id_tienda) ? '[Ya en ruta]' : '' }}
            </option>
          </select>
          <button @click="agregarTienda" class="btn-add-stop" :disabled="!idTiendaNueva">➕ Añadir a la lista</button>
        </div>

        <div class="actions-block">
          <button @click="guardarCambiosRuta" class="btn-submit-route" :disabled="guardando">
            {{ guardando ? 'Guardando y Optimizando con IA...' : '💾 Guardar y Re-optimizar Ruta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const rutasHoy = ref([]);
const todasLasTiendas = ref([]);
const idRutaSeleccionada = ref(null);
const paradasActuales = ref([]);
const idTiendaNueva = ref(null);
const guardando = ref(false);

const cargarIniciales = async () => {
  try {
    const [resRutas, resTiendas] = await Promise.all([
      axios.get('/admin/rutas-hoy'),
      axios.get('/desarrollador/tiendas')
    ]);
    rutasHoy.value = resRutas.data;
    todasLasTiendas.value = resTiendas.data;
  } catch (e) {
    console.error("Error inicializando el componente:", e);
  }
};

const cargarDetalleRuta = async () => {
  if (!idRutaSeleccionada.value) return;
  try {
    const res = await axios.get(`/admin/rutas-detalle/${idRutaSeleccionada.value}`);
    paradasActuales.value = res.data;
    idTiendaNueva.value = null;
  } catch (e) {
    console.error("Error al traer el detalle de la ruta:", e);
  }
};

const estaTiendaEnRuta = (id_tienda) => {
  return paradasActuales.value.some(p => p.id_tienda === id_tienda);
};

const agregarTienda = () => {
  if (!idTiendaNueva.value) return;
  const tiendaObj = todasLasTiendas.value.find(t => t.id_tienda === idTiendaNueva.value);
  if (tiendaObj) {
    paradasActuales.value.push({
      id_tienda: tiendaObj.id_tienda,
      nombre_tienda: tiendaObj.nombre_tienda,
      nombre_cadena: tiendaObj.nombre_cadena
    });
    idTiendaNueva.value = null;
  }
};

const removerTienda = (index) => {
  paradasActuales.value.splice(index, 1);
};

const guardarCambiosRuta = async () => {
  if (paradasActuales.value.length === 0) {
    const seguro = confirm("⚠️ Vas a dejar la ruta vacía. ¿Deseas continuar?");
    if (!seguro) return;
  }

  guardando.value = true;
  try {
    const listaIds = paradasActuales.value.map(p => p.id_tienda);
    await axios.put(`/admin/rutas/modificar/${idRutaSeleccionada.value}`, { tiendas: listaIds });
    alert("✅ Ruta actualizada. Se ha invocado a OR-Tools para optimizar las paradas.");
    await cargarIniciales();
    await cargarDetalleRuta();
  } catch (e) {
    console.error(e);
    alert("❌ Error actualizando la ruta: " + (e.response?.data?.error || "Error de servidor"));
  } finally {
    guardando.value = false;
  }
};

onMounted(() => {
  cargarIniciales();
});
</script>

<style scoped src="./EditarRutas.css"></style>