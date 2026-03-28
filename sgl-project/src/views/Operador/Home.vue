<template>
  <main class="menu-container">
    <header class="menu-header">
      <h1>Panel de Operador</h1>
      <p>Bienvenido, <strong>{{ userName }}</strong>. Seleccione un módulo para comenzar.</p>
    </header>

    <div class="cards-grid">
      <button class="menu-card" @click="goTo('mapa')">
        <div class="card-icon">🚛</div>
        <h2>Ruta de recolección</h2>
        <p>Mapa con la ruta más optima para la recolección.</p>
      </button>

      <button class="menu-card" @click="goTo('bitacora')">
        <div class="card-icon">📋</div>
        <h2>Registro de donativos</h2>
        <p>Formulario de la bítacora para la recolección.</p>
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
  router.push(`/${modulo}`);
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped src="./Home.css"></style>