<template>
  <main class="menu-container">
    <header class="menu-header">
      <h1>Panel de Administrador</h1>
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
    </div>

    <footer class="menu-footer">
      <button @click="logout" class="btn-logout">Cerrar Sesión</button>
    </footer>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
const userName = localStorage.getItem('userName') || 'Usuario';

const goTo = (modulo) => {
  // Aquí es donde luego crearemos las rutas /envios e /inventario
  router.push(`/${modulo}`);
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped src="./Home.css"></style>