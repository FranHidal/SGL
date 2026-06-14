<template>
  <header class="content-header"><h1>Asignación Operador - Unidad</h1></header>
  <div class="table-card">
    <table class="admin-table">
      <thead>
        <tr><th>Operador</th><th>Unidad Actual</th><th>Nueva Asignación</th><th>Acción</th></tr>
      </thead>
      <tbody>
        <tr v-for="op in listaOperadoresRelacion" :key="op.id_operador">
          <td>{{ op.nombre }} {{ op.primer_apellido }}</td>
          <td>
            <span v-if="op.matricula" class="badge active">{{ op.marca }} {{ op.modelo }} - {{ op.matricula }}</span>
            <span v-else class="badge danger">Sin Unidad</span>
          </td>
          <td>
            <select v-model="op.nuevo_id_vehiculo" class="admin-select">
              <option :value="null">-- Ninguno / A pie --</option>
              <option v-for="v in listaVehiculos" :key="v.id_vehiculo" :value="v.id_vehiculo">{{ v.marca }} {{ v.modelo }} ({{ v.matricula }})</option>
            </select>
          </td>
          <td><button @click="actualizarAsignacion(op)" class="btn-save small">Actualizar 🔄</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const listaVehiculos = ref([]);
const listaOperadoresRelacion = ref([]);

const cargarAsignaciones = async () => {
  try {
    const [resV, resOp] = await Promise.all([
      axios.get('/vehiculos'),
      axios.get('/operadores-unidades')
    ]);
    listaVehiculos.value = resV.data;
    listaOperadoresRelacion.value = resOp.data.map(op => ({ ...op, nuevo_id_vehiculo: op.id_vehiculo }));
  } catch (err) { console.error(err); }
};

onMounted(cargarAsignaciones);

const actualizarAsignacion = async (op) => {
  try {
    await axios.post(`/operadores/${op.id_operador}`, { id_vehiculo: op.nuevo_id_vehiculo });
    alert("Unidad vinculada.");
    cargarAsignaciones();
  } catch (err) { alert("Error al actualizar"); }
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
.admin-select {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  background-color: #fff;
  width: 100%;
}
.admin-select:focus {
  outline: none;
  border-color: #3b82f6;
}
.badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}
.badge.active { background-color: #dcfce7; color: #166534; }
.badge.danger { background-color: #fee2e2; color: #991b1b; }

.btn-save.small {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-save.small:hover {
  background-color: #059669;
  transform: translateY(-1px);
}
</style>