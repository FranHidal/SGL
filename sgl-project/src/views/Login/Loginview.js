import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    
    // Datos reactivos del formulario
    const credentials = reactive({
      usuario: '',
      password: ''
    });

    const submitLogin = async () => {
      try {
        // Hacemos la petición POST al servidor de Node
        const response = await axios.post('http://localhost:3000/login', {
          usuario: credentials.usuario,
          password: credentials.password
        });

        // Si el servidor responde con auth: true
        if (response.data.auth) {
          const user = response.data.user;
          console.log('Bienvenido:', user.nombre);
          
          // 1. Guardamos la sesión en el navegador
          localStorage.setItem('userName', user.nombre);
          localStorage.setItem('userRole', user.rol);
          localStorage.setItem('userId', user.id);
          
          // 2. Redirección inteligente según el rol que viene de la BD
          if (user.rol === 'admin') {
            router.push('/admin');
          } else if (user.rol === 'operador') {
            router.push('/home');
          } else {
            alert('Rol no reconocido. Contacta a soporte.');
          }
        }
      } catch (error) {
        // Manejo de errores de conexión o credenciales
        if (error.response && error.response.status === 401) {
          alert('Usuario o contraseña incorrectos. Revisa tu BD en DBeaver.');
        } else {
          alert('No se pudo conectar con el servidor. ¿Olvidaste encender Node?');
        }
        console.error('Error en el login:', error);
      }
    };

    // Retornamos lo que el HTML necesita usar
    return {
      credentials,
      submitLogin
    };
  }
};