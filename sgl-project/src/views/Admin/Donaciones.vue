<template>
  <div class="bitacora-container">
    <form @submit.prevent="enviarDonacion" class="bitacora-form">
      <header class="form-header">
        <h2>Programar Donación Futura</h2>
        <p>Registre las promesas de recolección de los próximos días</p>
      </header>

      <div class="form-row">
        <div class="form-group">
          <label>Tienda</label>
          <select v-model="form.id_tienda" @change="autoCompletarContacto" required>
            <option value="" disabled>-- Seleccione la sucursal --</option>
            <option v-for="t in listaTiendas" :key="t.id_tienda" :value="t.id_tienda">
              {{ t.nombre_tienda }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Contacto de la Tienda</label>
          <input type="text" :value="contactoSeleccionado" readonly class="input-readonly" placeholder="Seleccione tienda..." />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Teléfono de Contacto</label>
          <input type="text" :value="telefonoSeleccionado" readonly class="input-readonly" placeholder="Sin teléfono..." />
        </div>
        <div class="form-group">
          <label>Responsable</label>
          <input type="text" v-model="form.responsable" placeholder="Nombre del gestor" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Fecha Estimada</label>
          <input type="date" v-model="form.fecha_recoleccion" required />
        </div>
        <div class="form-group">
          <label>Hora Programada</label>
          <input type="time" v-model="form.hora_recoleccion" required />
        </div>
      </div>

      <div class="form-row" style="margin-top: 15px;">
        <div class="form-group">
          <label>Tipo de Donación</label>
          <select v-model="form.tipo_donacion" required>
            <option value="" disabled>-- Seleccione categoría --</option>
            <option value="Perecedero">Perecedero</option>
            <option value="No Perecedero">No Perecedero</option>
            <option value="Bazar">Bazar</option>
            <option value="Mixto">Carga Mixta</option>
          </select>
        </div>
        <div class="form-group">
          <label>Cantidad Estimada</label>
          <input type="number" v-model.number="form.cantidad" min="1" placeholder="Ej. 15" required />
        </div>
      </div>

      <div class="form-group" style="margin-top: 15px;">
        <label>Observaciones</label>
        <textarea v-model="form.observaciones" rows="3" placeholder="Indicar si se requiere tarimas, refrigeración o especificaciones de la carga..."></textarea>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn-cancel">Volver</button>
        <button type="submit" class="btn-submit" :disabled="guardando">
          {{ guardando ? 'Guardando Registro...' : 'Programar Donación' }}
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

const listaTiendas = ref([]);
const contactoSeleccionado = ref('');
const telefonoSeleccionado = ref('');

// Recuperar datos del usuario gerente logueado
const user = JSON.parse(localStorage.getItem('user') || '{}');

const form = reactive({
  id_tienda: '',
  id_contacto: null,
  fecha_recoleccion: '',
  hora_recoleccion: '09:00', // Valor por defecto sugerido
  tipo_donacion: '',
  cantidad: null,
  observaciones: '',
  responsable: user.nombre ? `${user.nombre}` : '' // Auto-asigna el nombre del gerente si existe en sesión
});

const cargarCatalogo = async () => {
  try {
    const res = await axios.get('/tiendas-contactos');
    listaTiendas.value = res.data;
  } catch (e) {
    console.error("Error al cargar tiendas:", e);
    alert("Error al inicializar el listado de tiendas.");
  }
};

const autoCompletarContacto = () => {
  const tienda = listaTiendas.value.find(x => x.id_tienda == form.id_tienda);
  if (tienda) {
    form.id_contacto = tienda.id_contacto;
    contactoSeleccionado.value = tienda.nombre_contacto;
    telefonoSeleccionado.value = tienda.telefono || 'Sin teléfono asignado';
  } else {
    form.id_contacto = null;
    contactoSeleccionado.value = '';
    telefonoSeleccionado.value = '';
  }
};

onMounted(() => {
  cargarCatalogo();
});

const enviarDonacion = async () => {
  if (form.cantidad <= 0) {
    alert('⚠️ La cantidad estimada debe ser mayor a 0');
    return;
  }

  guardando.value = true;
  try {
    await axios.post('/donaciones-futuras', form);
    alert('✅ Donación futura agendada exitosamente en el sistema.');
    
    // Limpieza de campos para dejar listo el formulario para otra captura
    form.id_tienda = '';
    form.id_contacto = null;
    form.fecha_recoleccion = '';
    form.tipo_donacion = '';
    form.cantidad = null;
    form.observaciones = '';
    contactoSeleccionado.value = '';
    telefonoSeleccionado.value = '';
  } catch (e) {
    alert('❌ Error al guardar: ' + (e.response?.data?.error || 'No se pudo registrar la donación'));
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped src="./Donaciones.css"></style>