<template>
  <header class="content-header"><h1>Directorio de Tiendas</h1></header>
  <div class="form-grid">
    <div class="form-card">
      <h3>Nueva Cadena</h3>
      <div class="form-group">
        <label>Nombre de la Cadena</label>
        <input v-model="cadenaForm.nombre_cadena" type="text" />
        <button @click="registrarCadena" class="btn-save" style="margin-top:10px">Agregar ➕</button>
      </div>
    </div>
    <div class="form-card" style="grid-column: span 2;">
      <h3>Nueva Sucursal y Responsable</h3>
      <form @submit.prevent="registrarTienda">
        <div class="form-grid">
          <div class="form-group"><label>Nombre Sucursal</label><input v-model="tiendaForm.nombre_tienda" required /></div>
          <div class="form-group"><label>Cadena</label>
            <select v-model="tiendaForm.id_cadena" required>
              <option v-for="c in listaCadenas" :key="c.id_cadena" :value="c.id_cadena">{{ c.nombre_cadena }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: span 2;"><label>Dirección</label><input v-model="tiendaForm.direccion" required /></div>
          <div class="form-group"><label>Latitud</label><input v-model="tiendaForm.latitud" type="number" step="any" required /></div>
          <div class="form-group"><label>Longitud</label><input v-model="tiendaForm.longitud" type="number" step="any" required /></div>
          <div style="grid-column: span 2; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
            <h4 style="color: #3b82f6;">👤 Datos del Contacto</h4>
          </div>
          <div class="form-group"><label>Nombre</label><input v-model="tiendaForm.c_nombre" required /></div>
          <div class="form-group"><label>Apellido</label><input v-model="tiendaForm.c_primer_apellido" required /></div>
          <div class="form-group"><label>Teléfono</label><input v-model="tiendaForm.c_telefono" required /></div>
          <div class="form-group"><label>Correo</label><input v-model="tiendaForm.c_correo" type="email" required /></div>
        </div>
        <button type="submit" class="btn-save" style="margin-top:20px">Guardar Tienda y Contacto 🏬</button>
      </form>
    </div>
  </div>

  <div class="form-card" style="margin-top: 30px;">
    <h3>Sucursales Registradas</h3>
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tienda</th>
            <th>Cadena</th>
            <th>Dirección</th>
            <th>Contacto</th>
            <th>Teléfono / Correo</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in listaTiendas" :key="t.id_tienda">
            <td>#{{ t.id_tienda }}</td>
            <td><strong>{{ t.nombre_tienda }}</strong></td>
            <td><span class="badge info">{{ t.nombre_cadena }}</span></td>
            <td>{{ t.direccion }}</td>
            <td>{{ t.contacto_nombre }} {{ t.contacto_apellido }}</td>
            <td>
              {{ t.telefono }} <br>
              <span style="font-size: 0.85rem; color: #64748b;">{{ t.correo_electronico }}</span>
            </td>
            <td>
              <button @click="eliminarTienda(t.id_tienda, t.id_contacto)" class="btn-delete">
                Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="listaTiendas.length === 0">
            <td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">
              No hay tiendas dadas de alta en el directorio.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const listaCadenas = ref([]);
const listaTiendas = ref([]); // 🌟 Almacena las tiendas para la tabla
const cadenaForm = reactive({ nombre_cadena: '' });
const tiendaForm = reactive({ nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null, c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: '' });

const cargarDatos = async () => {
  try {
    const [resCadenas, resTiendas] = await Promise.all([
      axios.get('/cadenas'),
      axios.get('/tiendas') // Consumirá tu GET del backend
    ]);
    listaCadenas.value = resCadenas.data;
    listaTiendas.value = resTiendas.data;
  } catch (err) { console.error("Error al cargar listados:", err); }
};

onMounted(cargarDatos);

const registrarCadena = async () => {
  if (!cadenaForm.nombre_cadena) return;
  await axios.post('/cadenas', cadenaForm);
  cadenaForm.nombre_cadena = '';
  cargarDatos();
};

const registrarTienda = async () => {
  try {
    const res = await axios.post('/tiendas', tiendaForm);
    alert("✅ " + res.data.message);
    Object.assign(tiendaForm, { nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null, c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: '' });
    cargarDatos(); // Recargar tabla
  } catch (err) { alert("Error al registrar tienda"); }
};

// 🌟 FUNCIÓN PARA ELIMINAR EL REGISTRO COMPLETO
const eliminarTienda = async (idTienda, idContacto) => {
  if (!confirm("¿Está seguro de eliminar esta sucursal junto con su información de contacto? Esta acción es irreversible.")) {
    return;
  }

  try {
    const res = await axios.delete(`/tiendas/${idTienda}/${idContacto}`);
    alert(res.data.message);
    cargarDatos(); // Refrescar vista
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "No se pudo eliminar la tienda. Verifique si está asignada a una ruta activa.");
  }
};
</script>

<style scoped>
.content-header h1 {
  font-size: 2rem;
  color: #0f172a;
  margin-bottom: 30px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.form-card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}
.form-card h3 {
  margin-bottom: 20px;
  color: #0f172a;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}
.form-group input, 
.form-group select {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  background-color: #fff;
  width: 100%;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}
.btn-save {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}
.table-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 15px;
  margin-bottom: 30px;
}

.badge {
  padding: 10px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.table-card td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
}
.badge.info { background-color: #e0f2fe; color: #030a0e; }
.btn-delete {
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.btn-delete:hover {
  background-color: #ef4444;
  color: white;
}
</style>