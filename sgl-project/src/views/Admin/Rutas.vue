<template>
  <div class="gestion-container">
    <aside class="admin-menu">
      <h2>Logística VSP 🚀</h2>
      <nav>
        <button class="nav-item active">Planificador de Rutas</button>
        <div class="menu-footer">
          <button @click="$router.push('/admin')" class="nav-item">Panel Principal</button>
        </div>
      </nav>
    </aside>

    <main class="gestion-content">
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
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const operadores = ref([]);
const tiendas = ref([]);

const plan = reactive({
  id_operador: null,
  seleccionadas: []
});

onMounted(async () => {
  const [resOp, resTiendas] = await Promise.all([
    axios.get('http://localhost:3000/api/operadores-unidades'),
    axios.get('http://localhost:3000/api/tiendas')
  ]);
  operadores.value = resOp.data;
  tiendas.value = resTiendas.data;
});

const crearRuta = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/rutas/generar', {
      id_operador: plan.id_operador,
      tiendas: plan.seleccionadas
    });
    alert(res.data.message);
    plan.seleccionadas = [];
    plan.id_operador = null;
  } catch (err) {
    alert("Error al guardar la ruta en la base de datos");
  }
};
</script>

<style src="./Rutas.css"></style>