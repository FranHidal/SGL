<template>
  <main class="menu-container">
    <header class="menu-header">
      <h1>Panel de Desarrollador</h1>
      <p>Bienvenido, <strong>{{ userName }}</strong>. Resumen general de logística.</p>
    </header>

    <div class="cards-grid">
      <button class="menu-card" @click="goTo('bitacoradesarrollo')">
        <div class="card-icon">📊</div>
        <h2>Historico de Bitácoras</h2>
        <p>Captura de las bítacoras de recolección de tiempo atrás</p>
      </button>
      <button class="menu-card" @click="goTo('configuracion')">
        <div class="card-icon">⚙️</div>
        <h2>Configuración de la página</h2>
        <p>Acciones de configuración para la página</p>
      </button>

    </div>

    <footer class="menu-footer">
      <button @click="logout" class="btn-logout">Cerrar Sesión</button>
    </footer>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

// Recuperamos el nombre del Director
const userRaw = localStorage.getItem('user');
const user = userRaw ? JSON.parse(userRaw) : null;
const userName = user ? user.nombre : 'Desarrollador';

const goTo = (modulo) => {
  router.push({ name: modulo });
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped src="./Home.css"></style>