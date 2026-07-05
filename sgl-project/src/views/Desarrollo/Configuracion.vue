<template>
  <div class="config-container">
    <header class="config-header">
      <h2>Configuración y Herramientas del Sistema</h2>
      <p>Panel exclusivo para desarrolladores y administradores.</p>
      <button type="button" @click="$router.push('/desarrollo')" class="btn-cancel">Volver</button>
    </header>

    <div class="config-grid">
      <div class="config-card">
        <div class="card-icon">⚙️</div>
        <div class="card-content">
          <h3>Resetear Ubicación de Operadores</h3>
          <p>
            Actualiza la ubicación actual de todos los operadores en la base de datos a las coordenadas centrales de la base (Cáritas). 
            Ideal para limpiar el mapa al finalizar la jornada.
          </p>
          <button 
            @click="resetearUbicaciones" 
            class="btn-action btn-danger" 
            :disabled="procesando"
          >
            {{ procesando ? 'Procesando...' : 'Resetear Coordenadas' }}
          </button>
        </div>
      </div>

      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const procesando = ref(false);

const resetearUbicaciones = async () => {
  // Confirmación de seguridad
  const seguro = confirm('⚠️ ¿Estás seguro de que deseas resetear la ubicación de TODOS los operadores? Esta acción no se puede deshacer.');
  if (!seguro) return;

  procesando.value = true;
  try {
    const res = await axios.post('/reset-ubicaciones');
    alert(`✅ Éxito: ${res.data.message}`);
  } catch (e) {
    console.error("Error al resetear ubicaciones:", e);
    alert('❌ Error: ' + (e.response?.data?.error || 'No se pudo completar la acción'));
  } finally {
    procesando.value = false;
  }
};
</script>

<style scoped src="./Configuracion.css"></style>