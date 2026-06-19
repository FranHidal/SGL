<template>
  <div class="bitacora-container">
    <form @submit.prevent="enviarRegistro" class="bitacora-form">
      <header class="form-header">
        <h2>Captura de Bitácora Histórica 📅</h2>
        <p>Módulo exclusivo para Desarrollador / Administrador</p>
      </header>

      <div class="form-row">
        <div class="form-group">
          <label>Seleccionar Tienda 🏪</label>
          <select v-model="form.id_tienda" @change="autoSeleccionarCadena" required>
            <option value="" disabled>-- Seleccione una tienda --</option>
            <option v-for="t in listaTiendas" :key="t.id_tienda" :value="t.id_tienda">
              {{ t.nombre_tienda }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Cadena 🏢</label>
          <input type="text" :value="nombreCadenaSeleccionada" readonly class="input-readonly" />
        </div>
      </div>

      <div class="form-section-title">Detalle de Recolección (kg) 📦</div>
      <div class="kilos-grid">
        <div class="kilos-card">
          <label>Perecedero</label>
          <input type="number" step="0.1" v-model.number="form.perecedero" placeholder="0.0" min="0" />
        </div>
        <div class="kilos-card">
          <label>No Perecedero</label>
          <input type="number" step="0.1" v-model.number="form.no_perecedero" placeholder="0.0" min="0" />
        </div>
        <div class="kilos-card">
          <label>Bazar</label>
          <input type="number" step="0.1" v-model.number="form.bazar" placeholder="0.0" min="0" />
        </div>
      </div>

      <div class="form-row" style="margin-top: 20px;">
        <div class="form-group">
          <label>Folio Ticket</label>
          <input type="text" v-model="form.folio" placeholder="ABC-123" required />
        </div>
        <div class="form-group">
          <label>Hora Llegada</label>
          <input type="time" v-model="form.hora_llegada" required />
        </div>
        <div class="form-group">
          <label>Hora Salida</label>
          <input type="time" v-model="form.hora_salida" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Fecha del Registro 📅</label>
          <input type="date" v-model="form.fecha" required />
        </div>

        <div class="form-group">
          <label>Operador Responsable 👤</label>
          <select v-model="form.id_operador" required>
            <option value="" disabled>-- Seleccione el operador --</option>
            <option v-for="op in listaOperadores" :key="op.id_operador" :value="op.id_operador">
              {{ op.nombre }} {{ op.primer_apellido }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Peso Total Calculado (kg) ⚖️</label>
        <input type="number" :value="totalCalculado" readonly class="input-total-auto" />
      </div>

      <div class="form-group">
        <label>Comentarios / Notas del Histórico</label>
        <textarea v-model="form.comentarios" rows="2" placeholder="Razón del registro extemporáneo..."></textarea>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.push('/desarrollo')" class="btn-cancel">Volver</button>
        <button type="submit" class="btn-submit" :disabled="guardando">
          {{ guardando ? 'Guardando Histórico...' : 'Guardar en Historial' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const guardando = ref(false);

// Listas para los Selectores hístoricos
const listaTiendas = ref([]);
const listaOperadores = ref([]);
const nombreCadenaSeleccionada = ref('Seleccione tienda');

const form = reactive({
  id_ruta: null, // No pertenece a una ruta del día actual
  hora_llegada: '08:00',
  hora_salida: '09:00',
  id_tienda: '',
  id_cadena: null,
  folio: '',
  perecedero: 0,
  no_perecedero: 0,
  bazar: 0,
  fecha: '', // Vacío para obligar a capturar la fecha histórica
  comentarios: '',
  id_operador: '' // Captura manual del operador
});

const totalCalculado = computed(() => {
  return parseFloat(((form.perecedero || 0) + (form.no_perecedero || 0) + (form.bazar || 0)).toFixed(2));
});

const cargarCatalogos = async () => {
  try {
    // Traer todas las tiendas del catálogo
    const resTiendas = await axios.get('/desarrollador/tiendas');
    listaTiendas.value = resTiendas.data;

    // Traer todos los operadores del catálogo
    const resOperadores = await axios.get('/desarrollador/operadores');
    listaOperadores.value = resOperadores.data;
  } catch (e) {
    console.error("Error al cargar catálogos históricos:", e);
    alert("Error al cargar las listas de tiendas u operadores");
  }
};

onMounted(() => {
  cargarCatalogos();
});

const autoSeleccionarCadena = () => {
  const t = listaTiendas.value.find(x => x.id_tienda == form.id_tienda);
  if (t) {
    form.id_cadena = t.id_cadena;
    nombreCadenaSeleccionada.value = t.nombre_cadena;
  }
};

const enviarRegistro = async () => {
  if (form.hora_salida < form.hora_llegada) {
    alert('⚠️ La hora de salida no puede ser anterior a la hora de llegada');
    return;
  }

  if (totalCalculado.value <= 0) {
    alert('⚠️ Por favor ingrese al menos una cantidad mayor a 0 kg');
    return;
  }

  guardando.value = true;
  try {
    // Apunta al mismo endpoint del backend ya que procesa el cuerpo exactamente igual
    await axios.post('/desarrollador/bitacora-historica', form);
    alert('✅ Registro histórico guardado con éxito');
    
    // Limpiar formulario para permitir otra captura rápida
    form.id_tienda = '';
    form.id_cadena = null;
    form.folio = '';
    form.perecedero = 0;
    form.no_perecedero = 0;
    form.bazar = 0;
    form.comentarios = '';
    nombreCadenaSeleccionada.value = 'Seleccione tienda';
  } catch (e) {
    alert('❌ Error: ' + (e.response?.data?.error || 'No se pudo guardar el registro histórico'));
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped src="./Bitacora.css"></style>