<template>
  <header class="content-header"><h1>Cuentas de Acceso</h1><p>Active las credenciales para el personal.</p></header>
  <div class="form-card">
    <form @submit.prevent="crearAcceso">
      <div class="form-grid">
        <div class="form-group">
          <label>Colaborador</label>
          <select v-model="accesoForm.id_colaborador" required>
            <option :value="null" disabled>-- Seleccione personal --</option>
            <option v-for="col in listaSinAcceso" :key="col.id_colaborador" :value="col.id_colaborador">{{ col.nombre }} {{ col.primer_apellido }} ({{ col.perfil }})</option>
          </select>
        </div>
        <div class="form-group"><label>Usuario</label><input v-model="accesoForm.usuario" required /></div>
        <div class="form-group"><label>Contraseña</label><input v-model="accesoForm.contrasena" type="password" required /></div>
        <div class="form-group">
          <label>Rol</label>
          <select v-model="accesoForm.rol" required>
            <option value="operador">Operador</option>
            <option value="admin">Gerente</option>
            <option value="director">Director</option>
            <option value="almacen">Almacen</option>
            <option value="adminvo">Administrativo</option>
            <option value="desarrollo">Desarrollo</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn-save" style="margin-top: 20px;">Activar Acceso 🚀</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const listaSinAcceso = ref([]);
const accesoForm = reactive({ id_colaborador: null, usuario: '', contrasena: '', rol: 'operador' });

const cargarSinAcceso = async () => {
  const res = await axios.get('/colaboradores-sin-acceso');
  listaSinAcceso.value = res.data;
};

onMounted(cargarSinAcceso);

const crearAcceso = async () => {
  try {
    const res = await axios.post('/usuarios/crear', accesoForm);
    alert(res.data.message);
    Object.assign(accesoForm, { id_colaborador: null, usuario: '', contrasena: '', rol: 'operador' });
    cargarSinAcceso();
  } catch (err) { alert(err.response?.data?.error || "Error"); }
};
</script>

<style scoped>
.content-header {
  margin-bottom: 30px;
}
.content-header h1 {
  font-size: 2rem;
  color: #0f172a;
  margin-bottom: 8px;
}
.content-header p {
  color: #64748b;
}
.form-card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
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