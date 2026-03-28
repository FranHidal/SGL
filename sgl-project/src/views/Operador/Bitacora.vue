<template>
  <div class="bitacora-container">
    <form @submit.prevent="enviarRegistro" class="bitacora-form">
      <header class="form-header">
        <h2>Registro de Bitácora</h2>
        <p>Folio de Control Logístico</p>
      </header>

      <div class="form-row">
        <div class="form-group">
          <label>Cadena 🏢</label>
          <select v-model="form.id_cadena" required>
            <option v-for="c in catalogos.cadenas" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tienda 🏪</label>
          <select v-model="form.id_tienda" required>
            <option v-for="t in catalogos.tiendas" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
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
        <label>Peso de Salida 🚛</label>
        <input type="number" step="0.01" v-model="form.peso_salida" placeholder="0.00" />
      </div>

      <div class="form-group">
        <label>Comentarios</label>
        <textarea v-model="form.comentarios" rows="3"></textarea>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.push('/home')" class="btn-cancel">Cancelar</button>
        <button type="submit" class="btn-submit">Guardar Registro</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = reactive({
  id_ruta: 1, // Esto vendría de la sesión o ruta activa
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
  id_operador: localStorage.getItem('userId') // Asumiendo que guardas el ID en login
});

// Para cargar los selectores desde la BD
const catalogos = reactive({ tiendas: [], cadenas: [] });

onMounted(async () => {
  // Aquí cargarías tus tablas de Tienda y Cadena
  // const resT = await axios.get('http://localhost:3000/api/tiendas');
  // catalogos.tiendas = resT.data;
});

const enviarRegistro = async () => {
  try {
    await axios.post('http://localhost:3000/api/bitacora', form);
    alert('✅ Registro guardado con éxito');
    router.push('/home');
  } catch (error) {
    alert('❌ Error al guardar el registro');
  }
};
</script>

<style scoped src="./Bitacora.css"></style>