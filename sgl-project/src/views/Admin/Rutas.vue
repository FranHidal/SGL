<template>
  <div class="gestion-container">
    <button class="menu-toggle" @click="menuAbierto = !menuAbierto" aria-label="Toggle Menu">
      <span v-if="!menuAbierto">☰ Menu</span>
      <span v-else>✕ Cerrar</span>
    </button>

    <div v-if="menuAbierto" class="menu-overlay" @click="menuAbierto = false"></div>

    <aside :class="['admin-menu', { 'is-open': menuAbierto }]">
      <h2>Logística VSP 🚀</h2>
      <nav>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'planificador' }"
          @click="cambiarTab('planificador')"
        >
          Planificador de Rutas
        </button>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'historial' }"
          @click="cambiarTab('historial')"
        >
          Rutas Creadas
        </button>
        <button 
          class="nav-item" 
          :class="{ active: tabActual === 'mapa' }"
          @click="cambiarTab('mapa')"
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

import PlanificadorRutas from './componentsRutas/PlanificacionRutas.vue';
import HistorialRutas from './componentsRutas/HistorialRutas.vue';
import MapaOperadores from './componentsRutas/MapaOperadores.vue';

const tabActual = ref('planificador');
// NUEVO: Estado para controlar el menú en pantallas pequeñas
const menuAbierto = ref(false);

const componentes = {
  planificador: PlanificadorRutas,
  historial: HistorialRutas,
  mapa: MapaOperadores
};

// NUEVO: Cambia de pestaña y colapsa el menú si está en móvil
const cambiarTab = (tab) => {
  tabActual.value = tab;
  menuAbierto.value = false;
};

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