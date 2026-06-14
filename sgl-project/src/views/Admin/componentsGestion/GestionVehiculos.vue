<template>
  <header class="content-header"><h1>Flota de Vehículos</h1></header>
  <div class="form-card">
    <form @submit.prevent="registrarVehiculo">
      <div class="form-grid">
        <div class="form-group"><label>Marca</label><input v-model="vehiculoForm.marca" required /></div>
        <div class="form-group"><label>Modelo</label><input v-model="vehiculoForm.modelo" required /></div>
        <div class="form-group"><label>Matrícula</label><input v-model="vehiculoForm.matricula" required /></div>
        <div class="form-group"><label>Mantenimiento</label><input v-model="vehiculoForm.fecha_mantenimiento" type="date" required /></div>
      </div>
      <button type="submit" class="btn-save">Guardar Vehículo 🚛</button>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import axios from 'axios';

const vehiculoForm = reactive({ marca: '', modelo: '', matricula: '', fecha_mantenimiento: '' });

const registrarVehiculo = async () => {
  try {
    await axios.post('/vehiculos', vehiculoForm);
    alert("Vehículo guardado.");
    Object.assign(vehiculoForm, { marca: '', modelo: '', matricula: '', fecha_mantenimiento: '' });
  } catch (err) { alert("Error al registrar vehículo"); }
};
</script>

<style scoped>
.content-header h1 {
  font-size: 2rem;
  color: #0f172a;
  margin-bottom: 30px;
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
.form-group input {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  background-color: #fff;
}
.form-group input:focus {
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
  margin-top: 20px;
}
.btn-save:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}
</style>