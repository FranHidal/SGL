<template>
  <div class="bitacora-container">
    <form @submit.prevent="enviarRegistro" class="bitacora-form">
      <header class="form-header">
        <h2>Registro de Entrega 🚚</h2>
      </header>

      <div class="form-row">
        <div class="form-group">
          <label>Tienda Asignada 🏪</label>
          <select v-model="form.id_tienda" @change="autoSeleccionarCadena" required>
            <option :value="null" disabled>-- Seleccione la parada --</option>
            <option v-for="t in paradasAsignadas" :key="t.id_tienda" :value="t.id_tienda">
              Parada {{ t.orden }}: {{ t.nombre_tienda }}
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
      </div>

      <div class="form-group">
        <label>Peso Total Calculado (kg) ⚖️</label>
        <input 
          type="number" 
          :value="totalCalculado" 
          readonly 
          class="input-total-auto"
          placeholder="0.0" 
        />
      </div>

      <div class="form-group">
        <label>Comentarios</label>
        <textarea v-model="form.comentarios" rows="2" placeholder="Notas adicionales..."></textarea>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.push('/home')" class="btn-cancel">Cancelar</button>
        <button type="submit" class="btn-submit" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Finalizar' }}
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
const paradasAsignadas = ref([]);
const nombreCadenaSeleccionada = ref('Seleccione tienda');
const user = JSON.parse(localStorage.getItem('user'));

const form = reactive({
  id_ruta: null,
  hora_llegada: '',
  id_tienda: null,
  id_cadena: null,
  folio: '',
  perecedero: 0,
  no_perecedero: 0,
  bazar: 0,
  peso: 0, 
  fecha: new Date().toISOString().split('T')[0],
  comentarios: '',
  id_operador: null
});

// Lógica de cálculo para visualización del usuario
const totalCalculado = computed(() => {
  const suma = (Number(form.perecedero) || 0) + (Number(form.no_perecedero) || 0) + (Number(form.bazar) || 0);
  return parseFloat(suma.toFixed(2));
});

onMounted(async () => {
  if (!user) { router.push('/'); return; }
  await cargarRuta();
});

const cargarRuta = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/operador/mi-ruta/${user.id_colaborador}`);
    if (res.data.length > 0) {
      paradasAsignadas.value = res.data;
      form.id_ruta = res.data[0].id_ruta;
      form.id_operador = res.data[0].id_operador;
      
      // Formatear hora actual HH:mm
      const ahora = new Date();
      form.hora_llegada = ahora.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
  } catch (e) {
    console.error("Error al cargar paradas:", e);
  }
};

const autoSeleccionarCadena = () => {
  const t = paradasAsignadas.value.find(x => x.id_tienda == form.id_tienda);
  if (t) {
    form.id_cadena = t.id_cadena;
    nombreCadenaSeleccionada.value = t.nombre_cadena;
  }
};

const enviarRegistro = async () => {
  if (totalCalculado.value <= 0) {
    alert('⚠️ Por favor ingrese al menos una cantidad mayor a 0');
    return;
  }

  guardando.value = true;
  try {
    // Enviamos el formulario. 
    // Perecedero, no_perecedero y bazar llevan las cantidades.
    const response = await axios.post('http://localhost:3000/api/bitacora', form);
    alert(response.data.message);
    router.push('/home');
  } catch (e) { 
    console.error(e);
    alert('❌ Error al guardar: ' + (e.response?.data?.error || 'Servidor no responde')); 
  } finally { 
    guardando.value = false; 
  }
};
</script>

<style scoped src="./Bitacora.css"></style>