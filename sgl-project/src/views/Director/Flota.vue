<template>
  <div class="flota-container">
    <header class="flota-header">
      <div class="header-titles">
        <h1>Estado de la Flota 🚛</h1>
        <p>Control de mantenimientos y disponibilidad de unidades</p>
      </div>
      <button @click="$router.back()" class="btn-regresar">Volver</button>
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
        <div class="table-wrapper">
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
              <tr v-if="cargando">
                <td colspan="5" class="text-center text-muted">Consultando estado de unidades...</td>
              </tr>
              <tr v-else-if="listaVehiculos.length === 0">
                <td colspan="5" class="text-center text-muted">No hay vehículos registrados en la flota.</td>
              </tr>
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
                    <span class="texto-estado">{{ getStatusText(v.fecha_mantenimiento) }}</span>
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
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const listaVehiculos = ref([]);
const cargando = ref(true);

const fetchVehiculos = async () => {
  try {
    cargando.value = true;
    // Apunta al nuevo endpoint modular del director sin URL quemadas
    const res = await axios.get('/flota-estado'); 
    listaVehiculos.value = res.data;
  } catch (err) {
    console.error("Error al cargar flota:", err);
  } finally {
    cargando.value = false;
  }
};

// --- LÓGICA DE FECHAS MEJORADA (6 MESES LÍMITE UTC) ---
const getStatusColor = (fechaStr) => {
  if (!fechaStr) return 'red';
  
  const hoy = new Date();
  // Solución al desfase: Extraemos año, mes (0-11) y día de la cadena pura
  const [anio, mes, dia] = fechaStr.split('T')[0].split('-');
  const ultimaCita = new Date(anio, mes - 1, dia);
  
  const limite = new Date(ultimaCita);
  limite.setMonth(limite.getMonth() + 6);

  // Diferencia de milisegundos convertida a días netos
  const diferenciaDias = (limite - hoy) / (1000 * 60 * 60 * 24);

  if (diferenciaDias <= 0) return 'red';        // Vencido
  if (diferenciaDias <= 15) return 'yellow';    // Próximo Crítico
  return 'green';                               // Al día / Operativo
};

const getStatusText = (fecha) => {
  const color = getStatusColor(fecha);
  if (color === 'red') return 'Mantenimiento Vencido';
  if (color === 'yellow') return 'Servicio Próximo';
  return 'Operativo';
};

// --- COMPUTED REACTIVOS PARA CONTROL OPERATIVO ---
const vehiculosVencidos = computed(() => listaVehiculos.value.filter(v => getStatusColor(v.fecha_mantenimiento) === 'red'));
const vehiculosPróximos = computed(() => listaVehiculos.value.filter(v => getStatusColor(v.fecha_mantenimiento) === 'yellow'));
const vehiculosAlDia = computed(() => listaVehiculos.value.filter(v => getStatusColor(v.fecha_mantenimiento) === 'green'));

const formatDate = (fechaStr) => {
  if (!fechaStr) return 'Sin Registro';
  const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' };
  return new Date(fechaStr).toLocaleDateString('es-MX', opciones);
};

const agendarServicio = (v) => {
  alert(`Abriendo orden de servicio mecánico para la unidad con matrícula: [ ${v.matricula} ]`);
};

onMounted(() => {
  fetchVehiculos();
});
</script>

<style scoped src="./Flota.css"></style>
<style scoped>
/* Ajustes de maquetación preventiva */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.text-center { text-align: center; }
.text-muted { color: #64748b; padding: 25px; font-style: italic; }
.estado-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* Asegura el dibujo perfecto de los círculos indicadores */
.circulo {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.circulo.red { background-color: #ef4444; box-shadow: 0 0 8px #f87171; }
.circulo.yellow { background-color: #f59e0b; box-shadow: 0 0 8px #fbbf24; }
.circulo.green { background-color: #10b981; box-shadow: 0 0 8px #34d399; }
.texto-estado { font-weight: 600; font-size: 0.9rem; }
</style>