<template>
  <header class="content-header">
    <h1>Planificación de Rutas</h1>
    <p>Seleccione al operador y las sucursales para crear el itinerario de hoy.</p>
  </header>

  <div class="form-grid">
    <div class="form-card">
      <h3>1. Seleccionar Operador</h3>
      <div class="form-group">
        <select v-model="plan.id_operador" class="admin-select">
          <option :value="null" disabled>-- Seleccione un Operador --</option>
          <option v-for="op in operadores" :key="op.id_operador" :value="op.id_operador">
            👤 {{ op.nombre }} {{ op.primer_apellido }} | [{{ op.matricula || 'Sin Unidad' }}]
          </option>
        </select>
      </div>
    </div>

    <div class="form-card" style="grid-column: span 2;">
      <h3>2. Tiendas disponibles en Cancún</h3>
      <div class="table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>📍</th>
              <th>Tienda</th>
              <th>Cadena</th>
              <th>Dirección</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tiendas" :key="t.id_tienda">
              <td>
                <input type="checkbox" :value="t.id_tienda" v-model="plan.seleccionadas" />
              </td>
              <td><strong>{{ t.nombre_tienda }}</strong></td>
              <td><span class="badge info">{{ t.nombre_cadena }}</span></td>
              <td>{{ t.direccion }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="action-bar">
        <span>{{ plan.seleccionadas.length }} paradas marcadas</span>
        <button 
          @click="crearRuta" 
          class="btn-save" 
          :disabled="!plan.id_operador || plan.seleccionadas.length === 0"
        >
          Generar Itinerario 🚛
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, defineEmits } from 'vue';
import axios from 'axios';

// Emitimos un evento al contenedor principal cuando se cree una ruta con éxito
const emit = defineEmits(['rutaCreada']);

const operadores = ref([]);
const tiendas = ref([]);

const plan = reactive({
  id_operador: null,
  seleccionadas: []
});

onMounted(async () => {
  try {
    const [resOp, resTiendas] = await Promise.all([
      axios.get('/operadores-unidades'),
      axios.get('/tiendas')
    ]);
    operadores.value = resOp.data;
    tiendas.value = resTiendas.data;
  } catch (err) {
    console.error("Error al cargar datos del planificador:", err);
  }
});

const crearRuta = async () => {
  try {
    const res = await axios.post('/rutas/generar', {
      id_operador: plan.id_operador,
      tiendas: plan.seleccionadas
    });
    alert(res.data.message);
    plan.seleccionadas = [];
    plan.id_operador = null;
    
    // Le avisamos a Rutas.vue que cambie al historial porque ya hay datos nuevos
    emit('rutaCreada');
  } catch (err) {
    alert("Error al guardar la ruta");
  }
};
</script>

<style scoped>
/* COMPONENTES DE ESTRUCTURA */
.content-header {
    margin-bottom: 30px;
}

.content-header h1 {
    font-size: 2rem;
    color: #0f172a;
}

.content-header p {
    color: #64748b;
    margin-top: 5px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
}

.form-card {
    background: white;
    padding: 25px;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.form-card h3 {
    margin-bottom: 20px;
    color: #1e293b;
    font-size: 1.1rem;
    border-left: 4px solid #3b82f6;
    padding-left: 10px;
    font-weight: 700;
}

/* Select de Operador */
.admin-select {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background-color: #fff;
    font-size: 1rem;
    cursor: pointer;
}

.admin-select:focus {
    outline: none;
    border-color: #3b82f6;
}

/* TABLA DE TIENDAS DISPONIBLES */
.table-card {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-top: 10px;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table th {
    position: sticky;
    top: 0;
    background: #f1f5f9;
    padding: 12px;
    text-align: left;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #64748b;
    z-index: 10;
    font-weight: 700;
}

.admin-table td {
    padding: 15px 12px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.95rem;
    color: #1e293b;
}

.admin-table tr:hover {
    background-color: #f8fafc;
}

/* Checkboxes */
input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3b82f6;
}

/* BADGES (CADENAS) */
.badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
}

.badge.info {
    background-color: #e0f2fe;
    color: #0369a1;
}

/* BARRA DE ACCIONES (GENERAR RUTA) */
.action-bar {
    margin-top: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #1e293b;
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.action-bar span {
    font-weight: 600;
    font-size: 1.1rem;
}

.btn-save {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-save:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-2px);
}

.btn-save:disabled {
    background-color: #475569;
    cursor: not-allowed;
    opacity: 0.7;
}
</style>