<template>
  <div class="gestion-container">
    <aside class="admin-menu">
      <h2>Panel de Gestión</h2>
      <nav>
        <button @click="vistaActual = 'crear'" :class="['nav-item', { active: vistaActual === 'crear' }]">
          Nuevo Colaborador 👤
        </button>
        <button @click="vistaActual = 'vehiculos'" :class="['nav-item', { active: vistaActual === 'vehiculos' }]">
          Gestionar Vehículos 🚛
        </button>
        <button @click="vistaActual = 'asignaciones'" :class="['nav-item', { active: vistaActual === 'asignaciones' }]">
          Asignar Unidades 🔑
        </button>
        <button @click="vistaActual = 'lista'" :class="['nav-item', { active: vistaActual === 'lista' }]">
          Lista de Personal 📋
        </button>
        <button @click="vistaActual = 'tiendas'" :class="['nav-item', { active: vistaActual === 'tiendas' }]">
          Gestionar Tiendas 🏬
        </button>
        <button @click="vistaActual = 'accesos'" :class="['nav-item', { active: vistaActual === 'accesos' }]">
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

// 1. Importamos los subcomponentes que acabamos de crear
import RegistroPersonal from './componentsGestion/RegistroPersonal.vue';
import FlotaVehiculos from './componentsGestion/GestionVehiculos.vue';
import AsignarUnidades from './componentsGestion/AsignacionUnidades.vue';
import ListaPersonal from './componentsGestion/ListadoPersonal.vue';
import DirectorioTiendas from './componentsGestion/GestionTiendas.vue';
import CuentasAcceso from './componentsGestion/CuentasAcceso.vue';

const router = useRouter();

// 2. Controlamos qué vista está activa (Por defecto inicia en 'crear')
const vistaActual = ref('crear');

// 3. Mapeamos las cadenas de texto con los objetos de componentes importados
const componentes = {
  crear: RegistroPersonal,
  vehiculos: FlotaVehiculos,
  asignaciones: AsignarUnidades,
  lista: ListaPersonal,
  tiendas: DirectorioTiendas,
  accesos: CuentasAcceso
};

const logout = () => { 
  localStorage.clear(); 
  router.push('/'); 
};
</script>

<style scoped src="./Gestion.css"></style>