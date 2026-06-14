<template>
  <header class="content-header">
    <h1>Registro de Personal</h1>
    <p>Ingrese los datos básicos del colaborador.</p>
  </header>
  <div class="form-card">
    <form @submit.prevent="registrarColaborador">
      <div class="form-grid">
        <div class="form-group"><label>Nombre(s)</label><input v-model="form.nombre" type="text" required /></div>
        <div class="form-group"><label>Primer Apellido</label><input v-model="form.primer_apellido" type="text" required /></div>
        <div class="form-group"><label>Segundo Apellido</label><input v-model="form.segundo_apellido" type="text" /></div>
        <div class="form-group"><label>Teléfono</label><input v-model="form.telefono" type="text" required /></div>
        <div class="form-group">
          <label>Perfil / Rol</label>
          <select v-model="form.id_perfil" required>
            <option :value="null" disabled>-- Seleccione puesto --</option>
            <option v-for="p in perfiles" :key="p.id_perfil" :value="p.id_perfil">{{ p.perfil }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Turno</label>
          <select v-model="form.turno">
            <option value="Matutino">Matutino</option>
            <option value="Vespertino">Vespertino</option>
            <option value="Nocturno">Nocturno</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn-save" style="margin-top: 20px;">Registrar Colaborador</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const perfiles = ref([]);
const form = reactive({ nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', id_perfil: null, turno: 'Matutino' });

onMounted(async () => {
  try {
    const res = await axios.get('/perfiles');
    perfiles.value = res.data;
  } catch (err) { console.error(err); }
});

const registrarColaborador = async () => {
  try {
    await axios.post('/colaboradores', form);
    alert("Colaborador registrado exitosamente.");
    Object.assign(form, { nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', id_perfil: null, turno: 'Matutino' });
  } catch (err) { alert("Error al registrar personal"); }
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
  margin-bottom: 30px;
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
  transition: border-color 0.2s;
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