<template>
  <main class="login-wrapper">
    <div class="login-container">
      <section class="login-image-section">
      </section>

      <section class="login-form-section">
        <header class="login-header">
          <h1>Sistema Inteligente de Cáritas</h1>
          <p>Ingresa tus datos de acceso</p>
        </header>

        <form @submit.prevent="submitLogin" class="login-form">
          <div class="field">
            <label>Usuario</label>
            <input v-model="credentials.usuario" type="text" placeholder="usuario" required />
          </div>

          <div class="field">
            <label>Contraseña</label>
            <input v-model="credentials.password" type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" class="submit-button">Iniciar Sesión</button>
        </form>
      </section>
    </div>
  </main>
</template>

<script src="./Loginview.js"></script>
<style scoped src="./Loginview.css"></style>