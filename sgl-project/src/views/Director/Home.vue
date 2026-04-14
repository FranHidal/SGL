<template>
  <main class="menu-container">
    <header class="menu-header">
      <h1>Panel de Dirección</h1>
      <p>Bienvenido, <strong>{{ userName }}</strong>. Resumen general de logística.</p>
    </header>

    <div class="cards-grid">
      <button class="menu-card" @click="goTo('dashboard')">
        <div class="card-icon">📊</div>
        <h2>Dashboard General</h2>
        <p>Visualiza el rendimiento de rutas y tiempos de entrega.</p>
      </button>

      <button class="menu-card" @click="goTo('flota')">
        <div class="card-icon">🚛</div>
        <h2>Estado de Flota</h2>
        <p>Consulta el estado de las unidades y mantenimientos pendientes.</p>
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
const userName = user ? user.nombre : 'Director';

const goTo = (modulo) => {
  router.push({ name: modulo });
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped src="./Home.css"></style>