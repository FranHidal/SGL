<template>
  <div class="config-container">
    <header class="config-header">
      <h2>Configuración y Herramientas del Sistema</h2>
      <p>Panel exclusivo para desarrolladores y administradores.</p>
      <button type="button" @click="$router.push('/desarrollo')" class="btn-cancel">Volver</button>
    </header>

    <div class="config-grid">
      <ResetOperadores />
      </div>

    <div class="config-management-section">
      <AdminEditarTiendas />
    </div>
  </div>
</template>

<script setup>
import ResetOperadores from './ComponenteConfiguracion/ResetVehiculos.vue';
import AdminEditarTiendas from './ComponenteConfiguracion/EditarTiendas.vue';
</script>

<style scoped src="./Configuracion.css"></style>