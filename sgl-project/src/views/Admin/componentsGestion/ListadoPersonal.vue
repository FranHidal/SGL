<template>
  <header class="content-header"><h1>Personal Registrado</h1></header>
  <div class="table-card">
    <table class="admin-table">
      <thead><tr><th>ID</th><th>Nombre</th><th>Puesto</th><th>Turno</th><th>Acciones</th></tr></thead>
      <tbody>
        <tr v-for="c in colaboradores" :key="c.id_colaborador">
          <td>#{{ c.id_colaborador }}</td>
          <td>{{ c.nombre }} {{ c.primer_apellido }}</td>
          <td><span class="badge">{{ c.nombre_perfil }}</span></td>
          <td>{{ c.turno }}</td>
          <td><button @click="eliminarColaborador(c.id_colaborador)" class="btn-delete">Baja</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const colaboradores = ref([]);

const cargarColaboradores = async () => {
  const res = await axios.get('/colaboradores');
  colaboradores.value = res.data;
};

onMounted(cargarColaboradores);

const eliminarColaborador = async (id) => {
  if (confirm("¿Eliminar?")) {
    await axios.delete(`/colaboradores/${id}`);
    cargarColaboradores();
  }
};
</script>

<style scoped>
.content-header h1 {
  font-size: 2rem;
  color: #0f172a;
  margin-bottom: 30px;
}
.table-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
}
.admin-table th {
  background-color: #f8fafc;
  padding: 16px;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
}
.admin-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  font-size: 0.95rem;
  vertical-align: middle;
}
.admin-table tr:hover {
  background-color: #f1f5f9;
}
.badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  background-color: #e0f2fe;
  color: #0369a1;
}
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