<template>
  <div class="bitacora-container">
    <form @submit.prevent="enviarRegistro" class="bitacora-form">
      <header class="form-header">
        <h2>Registro de Entrega 🚚</h2>
        <p>Seleccione los tipos de carga recolectados</p>
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

      <div class="form-section-title">¿Qué se recolectó? 📦</div>
      <div class="carga-selector-grid">
        <label class="check-card" :class="{ 'is-active': form.perecedero }">
          <input type="checkbox" v-model="form.perecedero" :true-value="1" :false-value="0" />
          <span class="icon">🍎</span>
          <span class="text">Perecedero</span>
        </label>

        <label class="check-card" :class="{ 'is-active': form.no_perecedero }">
          <input type="checkbox" v-model="form.no_perecedero" :true-value="1" :false-value="0" />
          <span class="icon">🥫</span>
          <span class="text">No Perecedero</span>
        </label>

        <label class="check-card" :class="{ 'is-active': form.bazar }">
          <input type="checkbox" v-model="form.bazar" :true-value="1" :false-value="0" />
          <span class="icon">🧸</span>
          <span class="text">Bazar</span>
        </label>
      </div>

      <div class="form-row" style="margin-top: 20px;">
        <div class="form-group">
          <label>Folio Ticket</label>
          <input type="text" v-model="form.folio" placeholder="ABC-123" required />
        </div>
        <div class="form-group" style="margin-left: 20px;">
          <label>Hora Llegada</label>
          <input type="time" v-model="form.hora_llegada" required />
        </div>
      </div>

        <div class="form-group">
          <label>Peso Total (kg)</label>
          <input type="number" step="0.1" v-model.number="form.peso" placeholder="0.0" />
        </div>

      <div class="form-group">
        <label>Comentarios</label>
        <textarea v-model="form.comentarios" rows="2"></textarea>
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
import { reactive, ref, onMounted } from 'vue';
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
  // Usamos 0 por defecto para que la BD reciba el entero
  perecedero: 0,
  no_perecedero: 0,
  bazar: 0,
  peso: 0,
  peso_salida: 0,
  fecha: new Date().toISOString().split('T')[0],
  comentarios: '',
  id_operador: null
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
      form.hora_llegada = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  } catch (e) { console.error(e); }
};

const autoSeleccionarCadena = () => {
  const t = paradasAsignadas.value.find(x => x.id_tienda == form.id_tienda);
  if (t) {
    form.id_cadena = t.id_cadena;
    nombreCadenaSeleccionada.value = t.nombre_cadena;
  }
};

const enviarRegistro = async () => {
  guardando.value = true;
  try {
    await axios.post('http://localhost:3000/api/bitacora', form);
    alert('✅ Registrado');
    router.push('/home');
  } catch (e) { alert('❌ Error'); }
  finally { guardando.value = false; }
};
</script>

<style scoped src="./Bitacora.css"></style>