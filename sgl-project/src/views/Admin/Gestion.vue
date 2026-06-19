<template>
  <div class="gestion-container">
    <button class="menu-toggle" @click="menuAbierto = !menuAbierto" aria-label="Toggle Menu">
      <span v-if="!menuAbierto">☰ Menu</span>
      <span v-else>✕ Cerrar</span>
    </button>

    <div v-if="menuAbierto" class="menu-overlay" @click="menuAbierto = false"></div>

    <aside :class="['admin-menu', { 'is-open': menuAbierto }]">
      <h2>Panel de Gestión</h2>
      <nav>
        <button @click="seleccionarVista('crear')" :class="['nav-item', { active: vistaActual === 'crear' }]">
          Nuevo Colaborador 👤
        </button>
        <button @click="seleccionarVista('vehiculos')" :class="['nav-item', { active: vistaActual === 'vehiculos' }]">
          Gestionar Vehículos 🚛
        </button>
        <button @click="seleccionarVista('asignaciones')" :class="['nav-item', { active: vistaActual === 'asignaciones' }]">
          Asignar Unidades 🔑
        </button>
        <button @click="seleccionarVista('lista')" :class="['nav-item', { active: vistaActual === 'lista' }]">
          Lista de Personal 📋
        </button>
        <button @click="seleccionarVista('tiendas')" :class="['nav-item', { active: vistaActual === 'tiendas' }]">
          Gestionar Tiendas 🏬
        </button>
        <button @click="seleccionarVista('accesos')" :class="['nav-item', { active: vistaActual === 'accesos' }]">
          Cuentas de Acceso 🔑
        </button>
        <div class="menu-footer">
          <button @click="$router.push('/admin')" class="nav-item">Volver al Panel</button>
          <button @click="logout" class="btn-logout-admin">Cerrar Sesión</button>
        </div>
      </nav>
    </aside>

    <main class="gestion-content">
      <section class="fade-in">
        <component :is="componentes[vistaActual]" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import RegistroPersonal from './componentsGestion/RegistroPersonal.vue';
import FlotaVehiculos from './componentsGestion/GestionVehiculos.vue';
import AsignarUnidades from './componentsGestion/AsignacionUnidades.vue';
import ListaPersonal from './componentsGestion/ListadoPersonal.vue';
import DirectorioTiendas from './componentsGestion/GestionTiendas.vue';
import CuentasAcceso from './componentsGestion/CuentasAcceso.vue';

const router = useRouter();

const vistaActual = ref('crear');
// NUEVO: Estado para alternar el menú en móviles
const menuAbierto = ref(false);

const componentes = {
  crear: RegistroPersonal,
  vehiculos: FlotaVehiculos,
  asignaciones: AsignarUnidades,
  lista: ListaPersonal,
  tiendas: DirectorioTiendas,
  accesos: CuentasAcceso
};

// NUEVO: Cambia la vista y cierra el menú automáticamente en móvil
const seleccionarVista = (vista) => {
  vistaActual.value = vista;
  menuAbierto.value = false;
};

const logout = () => { 
  localStorage.clear(); 
  router.push('/'); 
};
</script>

<style scoped src="./Gestion.css"></style>