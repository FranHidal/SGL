<template>
  <main class="menu-container">
    <header class="menu-header">
      <h1>Panel de Gerente</h1>
      <p>Bienvenido, <strong>{{ userName }}</strong>. Seleccione un módulo para comenzar.</p>
    </header>

    <div class="cards-grid">
      <button class="menu-card" @click="goTo('rutas')">
        <div class="card-icon">🗺️</div>
        <h2>Asignación de rutas</h2>
        <p>Establecer las rutas de recolección a los operarodores.</p>
      </button>

      <button class="menu-card" @click="goTo('gestion')">
        <div class="card-icon">✏️</div>
        <h2>Gestión de operadores y rutas</h2>
        <p>Agregar o eliminar operadores y puntos de recolección.</p>
      </button>

      <button class="menu-card" @click="goTo('tablabitacoras')">
        <div class="card-icon">📝</div>
        <h2>Tabla de las Bitácoras</h2>
        <p>Visualización de las bítacoras de recolección</p>
      </button>

      <button class="menu-card" @click="goTo('donaciones')">
        <div class="card-icon">📅</div>
        <h2>Donaciones futuras</h2>
        <p>Agendar donaciones futuras</p>
      </button>

      <button class="menu-card" @click="goTo('dashboardlogistica')">
        <div class="card-icon">📊</div>
        <h2>Dashboard de Logística</h2>
        <p>Visualización del tablero de operaciones</p>
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

// 1. Buscamos el objeto completo 'user'
const userRaw = localStorage.getItem('user');
const user = userRaw ? JSON.parse(userRaw) : null;

// 2. Extraemos el nombre del objeto
const userName = user ? user.nombre : 'Administrador';

const goTo = (modulo) => {
  router.push({ name: modulo }); // Es más seguro usar el nombre de la ruta
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped src="./Home.css"></style>