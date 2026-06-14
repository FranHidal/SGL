<template>
  <div class="gestion-container">
    <aside class="admin-menu">
      <h2>Logística VSP 🚀</h2>
      <nav>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'planificador' }"
          @click="tabActual = 'planificador'"
        >
          Planificador de Rutas
        </button>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'historial' }"
          @click="tabActual = 'historial'"
        >
          Rutas Creadas
        </button>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'mapa' }"
          @click="tabActual = 'mapa'"
        >
          Mapa de Operadores
        </button>

        <div class="menu-footer">
          <button @click="$router.push('/admin')" class="nav-item">Panel Principal</button>
        </div>
      </nav>
    </aside>

    <main class="gestion-content">
      <section class="fade-in">
        <component 
          :is="componentes[tabActual]" 
          @rutaCreada="irAlHistorial" 
        />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Importación relativa basándonos en tu arquitectura de carpetas
import PlanificadorRutas from './componentsRutas/PlanificacionRutas.vue';
import HistorialRutas from './componentsRutas/HistorialRutas.vue';
import MapaOperadores from './componentsRutas/MapaOperadores.vue';

const tabActual = ref('planificador');

// Diccionario de componentes dinámicos
const componentes = {
  planificador: PlanificadorRutas,
  historial: HistorialRutas,
  mapa: MapaOperadores
};

// Función que se activa cuando el planificador emite que guardó una ruta
const irAlHistorial = () => {
  tabActual.value = 'historial';
};
</script>

<style scoped src="./Rutas.css"></style>
<style scoped>
/* Animaciones de transición de pestañas */
.fade-in {
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>