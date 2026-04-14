<template>
  <div class="flota-container">
    <header class="flota-header">
      <div class="header-titles">
        <h1>Estado de la Flota 🚛</h1>
        <p>Control de mantenimientos y disponibilidad de unidades</p>
      </div>
      <button @click="$router.push('/director')" class="btn-regresar">Volver</button>
    </header>

    <main class="flota-content">
      <section class="resumen-flota">
        <div class="tarjeta-kpi red">
          <h3>Vencidos</h3>
          <span class="valor">{{ vehiculosVencidos.length }}</span>
        </div>
        <div class="tarjeta-kpi yellow">
          <h3>Próximos (15 días)</h3>
          <span class="valor">{{ vehiculosPróximos.length }}</span>
        </div>
        <div class="tarjeta-kpi green">
          <h3>Al día</h3>
          <span class="valor">{{ vehiculosAlDia.length }}</span>
        </div>
      </section>

      <section class="tabla-contenedor">
        <table class="tabla-flota">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Matrícula</th>
              <th>Último Servicio</th>
              <th>Estado de Mantenimiento</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in listaVehiculos" :key="v.id_vehiculo">
              <td>
                <div class="unidad-info">
                  <span class="marca">{{ v.marca }}</span>
                  <span class="modelo">{{ v.modelo }}</span>
                </div>
              </td>
              <td><span class="matricula-tag">{{ v.matricula }}</span></td>
              <td>{{ formatDate(v.fecha_mantenimiento) }}</td>
              <td>
                <div class="estado-wrapper">
                  <span :class="['circulo', getStatusColor(v.fecha_mantenimiento)]"></span>
                  {{ getStatusText(v.fecha_mantenimiento) }}
                </div>
              </td>
              <td>
                <button @click="agendarServicio(v)" class="btn-mantenimiento">
                  🛠️ Agendar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const listaVehiculos = ref([]);

onMounted(() => {
  fetchVehiculos();
});

const fetchVehiculos = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/vehiculos');
    listaVehiculos.value = res.data;
  } catch (err) {
    console.error("Error al cargar flota:", err);
  }
};

// --- LÓGICA DE FECHAS (6 MESES LÍMITE) ---
const getStatusColor = (fecha) => {
  const hoy = new Date();
  const ultimaCita = new Date(fecha);
  const limite = new Date(ultimaCita);
  limite.setMonth(limite.getMonth() + 6);

  const diferenciaDias = (limite - hoy) / (1000 * 60 * 60 * 24);

  if (diferenciaDias <= 0) return 'red';        // Vencido
  if (diferenciaDias <= 15) return 'yellow';    // Crítico
  return 'green';                               // OK
};

const getStatusText = (fecha) => {
  const color = getStatusColor(fecha);
  if (color === 'red') return 'Mantenimiento Vencido';
  if (color === 'yellow') return 'Servicio Próximo';
  return 'Operativo';
};

// --- COMPUTED PARA KPIs ---
const vehiculosVencidos = computed(() => listaVehiculos.value.filter(v => getStatusColor(v.fecha_mantenimiento) === 'red'));
const vehiculosPróximos = computed(() => listaVehiculos.value.filter(v => getStatusColor(v.fecha_mantenimiento) === 'yellow'));
const vehiculosAlDia = computed(() => listaVehiculos.value.filter(v => getStatusColor(v.fecha_mantenimiento) === 'green'));

const formatDate = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-MX');
};

const agendarServicio = (v) => {
  alert(`Abriendo agenda para unidad ${v.matricula}...`);
};
</script>

<style scoped src="./Flota.css"></style>