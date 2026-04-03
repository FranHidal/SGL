<template>
  <div class="bitacora-container">
    <form @submit.prevent="enviarRegistro" class="bitacora-form">
      <header class="form-header">
        <h2>Registro de Entrega 🚚</h2>
        <p>Unidad: {{ datosRuta.matricula || 'Cargando...' }}</p>
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

      <div class="form-row">
        <div class="form-group">
          <label>Folio Ticket/Remisión</label>
          <input type="text" v-model="form.folio" placeholder="ABC-12345" required />
        </div>
        <div class="form-group">
          <label>Hora de Llegada 🕒</label>
          <input type="time" v-model="form.hora_llegada" required />
        </div>
      </div>

      <div class="form-section-title">Pesos y Carga (kg) ⚖️</div>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Perecedero</label>
          <input type="number" step="0.01" v-model="form.perecedero" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label>Bazar</label>
          <input type="number" step="0.01" v-model="form.bazar" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label>Peso Total Entrante</label>
          <input type="number" step="0.01" v-model="form.peso" placeholder="0.00" required />
        </div>
      </div>

      <div class="form-group">
        <label>Peso de Salida 🚛 (Vaciado/Devolución)</label>
        <input type="number" step="0.01" v-model="form.peso_salida" placeholder="0.00" />
      </div>

      <div class="form-group">
        <label>Comentarios / Observaciones</label>
        <textarea v-model="form.comentarios" rows="3" placeholder="Ej. Retraso por tráfico en la zona hotelera..."></textarea>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.push('/home')" class="btn-cancel">Cancelar</button>
        <button type="submit" class="btn-submit" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Finalizar Entrega' }}
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
const datosRuta = ref({});
const nombreCadenaSeleccionada = ref('Seleccione tienda');

// Obtenemos los datos del usuario desde el localStorage (guardados en el Login)
const user = JSON.parse(localStorage.getItem('user'));

const form = reactive({
  id_ruta: null,
  hora_llegada: '',
  id_tienda: null,
  id_cadena: null,
  folio: '',
  perecedero: 0,
  bazar: 0,
  peso: 0,
  peso_salida: 0,
  fecha: new Date().toISOString().split('T')[0],
  comentarios: '',
  id_operador: user?.id_colaborador || null
});

onMounted(async () => {
  if (!user) {
    router.push('/');
    return;
  }
  await cargarDatosRutaDelDia();
});

const cargarDatosRutaDelDia = async () => {
  try {
    // 1. Obtener las paradas ordenadas por el algoritmo VSP para este operador
    const res = await axios.get(`http://localhost:3000/api/operador/mi-ruta/${user.id_colaborador}`);
    
    if (res.data.length > 0) {
      paradasAsignadas.value = res.data;
      // El id_ruta está en cualquiera de los registros de la consulta
      form.id_ruta = res.data[0].id_ruta;
      // Si el endpoint no trae la matrícula, podrías hacer otro fetch o usar lo que tengas en sesion
    } else {
      alert("No tienes una ruta asignada para hoy.");
      router.push('/home');
    }
  } catch (error) {
    console.error("Error al cargar ruta:", error);
  }
};

const autoSeleccionarCadena = () => {
  const tienda = paradasAsignadas.value.find(t => t.id_tienda === form.id_tienda);
  if (tienda) {
    form.id_cadena = tienda.id_cadena;
    nombreCadenaSeleccionada.value = tienda.nombre_cadena;
  }
};

const enviarRegistro = async () => {
  guardando.value = true;
  try {
    await axios.post('http://localhost:3000/api/bitacora', form);
    alert('✅ Entrega registrada en el sistema');
    router.push('/home');
  } catch (error) {
    alert('❌ Error al guardar en la base de datos');
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped src="./Bitacora.css"></style>