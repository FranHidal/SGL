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
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const listaCadenas = ref([]);
const cadenaForm = reactive({ nombre_cadena: '' });
const tiendaForm = reactive({ nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null, c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: '' });

const cargarCadenas = async () => {
  const res = await axios.get('/cadenas');
  listaCadenas.value = res.data;
};

onMounted(cargarCadenas);

const registrarCadena = async () => {
  if (!cadenaForm.nombre_cadena) return;
  await axios.post('/cadenas', cadenaForm);
  cadenaForm.nombre_cadena = '';
  cargarCadenas();
};

const registrarTienda = async () => {
  try {
    const res = await axios.post('/tiendas', tiendaForm);
    alert("✅ " + res.data.message);
    Object.assign(tiendaForm, { nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null, c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: '' });
  } catch (err) { alert("Error al registrar tienda"); }
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
</style>