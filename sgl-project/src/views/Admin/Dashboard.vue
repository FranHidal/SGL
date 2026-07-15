<template>
  <div class="dashboard-container">
    <!-- Encabezado del Dashboard -->
    <header class="dashboard-header">
      <div class="header-info">
        <h2>Panel de Control Logístico</h2>
        <p>Monitoreo en tiempo real de recolecciones, rutas y efectividad del CEDIS Cáritas Cancún.</p>
      </div>
      <div class="header-actions">
        <button type="button" @click="$router.push('/home')" class="btn-back-home">
          🏠 Volver al Inicio
        </button>
      </div>
    </header>

    <!-- Sección Central: Mapa a Pantalla Completa -->
    <section class="main-dashboard-grid single-layout">
      <!-- Módulo del Mapa -->
      <div class="dashboard-section map-section full-width">
        <div class="section-header">
          <h4>🛰️ Georreferenciación de Flota en Vivo</h4>
        </div>
        <div class="section-body">
          <AdminMapaFlota />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import AdminMapaFlota from './componentsDashboard/MapaDashboard.vue'; // Valida la ruta de carpetas
</script>

<style scoped src="./Dashboard.css"></style>