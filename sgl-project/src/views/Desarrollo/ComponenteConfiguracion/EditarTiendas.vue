<template>
  <div class="edit-tiendas-wrapper">
    <div class="section-title-container">
      <h3>Gestión y Edición de Sucursales</h3>
      <p>Modifica los datos generales de las tiendas y sus contactos asignados directamente desde la tabla.</p>
    </div>

    <div class="table-responsive">
      <table class="crud-table">
        <thead>
          <tr>
            <th>Tienda</th>
            <th>Cadena</th>
            <th>Dirección</th>
            <th>Coordenadas (Lat, Lng)</th>
            <th>Contacto Responsable</th>
            <th>Teléfono / Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tiendas" :key="t.id_tienda" :class="{ 'row-editing': editandoId === t.id_tienda }">
            
            <td>
              <input v-if="editandoId === t.id_tienda" type="text" v-model="formEdit.nombre_tienda" class="table-input" />
              <span v-else class="text-bold">{{ t.nombre_tienda }}</span>
            </td>

            <td>
              <select v-if="editandoId === t.id_tienda" v-model="formEdit.id_cadena" class="table-select">
                <option v-for="c in cadenas" :key="c.id_cadena" :value="c.id_cadena">
                  {{ c.nombre_cadena }}
                </option>
              </select>
              <span v-else class="badge-cadena">{{ t.nombre_cadena }}</span>
            </td>

            <td>
              <textarea v-if="editandoId === t.id_tienda" v-model="formEdit.direccion" class="table-textarea" rows="2"></textarea>
              <span v-else class="text-muted text-sm">{{ t.direccion }}</span>
            </td>

            <td>
              <div v-if="editandoId === t.id_tienda" class="geo-inputs">
                <input type="number" step="0.00000001" v-model.number="formEdit.latitud" placeholder="Lat" class="table-input sm" />
                <input type="number" step="0.00000001" v-model.number="formEdit.longitud" placeholder="Lng" class="table-input sm" />
              </div>
              <span v-else class="geo-text">📍 {{ t.latitud }}, {{ t.longitud }}</span>
            </td>

            <td>
              <div v-if="editandoId === t.id_tienda" class="name-inputs">
                <input type="text" v-model="formEdit.contacto_nombre" placeholder="Nombre" class="table-input" />
                <input type="text" v-model="formEdit.contacto_apellido" placeholder="Apellido" class="table-input" />
              </div>
              <span v-else>{{ t.contacto_nombre }} {{ t.contacto_apellido }}</span>
            </td>

            <td>
              <div v-if="editandoId === t.id_tienda" class="contact-inputs">
                <input type="text" v-model="formEdit.telefono" placeholder="Teléfono" class="table-input" />
                <input type="email" v-model="formEdit.correo_electronico" placeholder="Correo" class="table-input" />
              </div>
              <div v-else class="contact-display">
                <span class="text-sm">📞 {{ t.telefono || 'N/A' }}</span>
                <span class="text-muted text-xs">✉️ {{ t.correo_electronico || 'N/A' }}</span>
              </div>
            </td>

            <td>
              <div v-if="editandoId === t.id_tienda" class="actions-cell">
                <button @click="guardarCambios(t.id_tienda, t.id_contacto)" class="btn-save" :disabled="guardando">💾</button>
                <button @click="cancelarEdicion" class="btn-cancel" :disabled="guardando">❌</button>
              </div>
              <div v-else class="actions-cell">
                <button @click="activarEdicion(t)" class="btn-edit">✏️ Editar</button>
              </div>
            </td>

          </tr>
          <tr v-if="tiendas.length === 0">
            <td colspan="7" class="text-center text-muted">No hay sucursales registradas en el sistema.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const tiendas = ref([]);
const cadenas = ref([]);
const editandoId = ref(null);
const guardando = ref(false);

// Objeto reactivo temporal para almacenar los datos editados de la fila seleccionada
const formEdit = reactive({
  nombre_tienda: '',
  id_cadena: null,
  direccion: '',
  latitud: null,
  longitud: null,
  contacto_nombre: '',
  contacto_apellido: '',
  telefono: '',
  correo_electronico: ''
});

const cargarDatos = async () => {
  try {
    // Usamos tus endpoints existentes para jalar el directorio actual
    const [resTiendas, resCadenas] = await Promise.all([
      axios.get('/tiendas'),
      axios.get('/cadenas')
    ]);
    tiendas.value = resTiendas.data;
    cadenas.value = resCadenas.data;
  } catch (e) {
    console.error("Error cargando sucursales:", e);
    alert("❌ Error al leer los datos de tiendas.");
  }
};

onMounted(() => {
  cargarDatos();
});

const activarEdicion = (tienda) => {
  editandoId.value = tienda.id_tienda;
  // Copiar valores actuales de la fila al objeto editable
  formEdit.nombre_tienda = tienda.nombre_tienda;
  formEdit.id_cadena = tienda.id_cadena;
  formEdit.direccion = tienda.direccion;
  formEdit.latitud = tienda.latitud;
  formEdit.longitud = tienda.longitud;
  formEdit.contacto_nombre = tienda.contacto_nombre;
  formEdit.contacto_apellido = tienda.contacto_apellido;
  formEdit.telefono = tienda.telefono;
  formEdit.correo_electronico = tienda.correo_electronico;
};

const cancelarEdicion = () => {
  editandoId.value = null;
};

const guardarCambios = async (id_tienda, id_contacto) => {
  if (!formEdit.nombre_tienda.trim()) {
    alert("⚠️ El nombre de la tienda es requerido.");
    return;
  }

  guardando.value = true;
  try {
    await axios.put(`/admin/tiendas/${id_tienda}/${id_contacto}`, formEdit);
    alert("✅ Tienda y contacto actualizados correctamente.");
    editandoId.value = null;
    await cargarDatos(); // Recargar datos frescos del servidor
  } catch (e) {
    console.error(e);
    alert("❌ Error al guardar cambios: " + (e.response?.data?.error || "Desconocido"));
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped src="./EditarTiendas.css"></style>