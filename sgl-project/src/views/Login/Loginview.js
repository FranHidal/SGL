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
          console.log('Sesión iniciada para:', user.nombre);
          
          // 1. GUARDADO UNIFICADO (La "llave" que el Router y el Mapa esperan)
          // Guardamos el objeto completo convertido a String
          localStorage.setItem('user', JSON.stringify(user));
          
          // 2. REDIRECCIÓN INTELIGENTE (Convertimos a minúsculas para evitar fallos)
          const rol = user.rol.toLowerCase();

          if (rol === 'admin') {
            router.push('/admin');
          } else if (rol === 'operador') {
            router.push('/home');
          } else if (rol === 'director') {
            router.push('/director');
          } else {
            alert('Rol no reconocido (' + user.rol + '). Contacta a soporte.');
          }
        }
      } catch (error) {
        // Manejo de errores de conexión o credenciales
        if (error.response && error.response.status === 401) {
          alert('Usuario o contraseña incorrectos.');
        } else {
          alert('Error de conexión. Verifica que el servidor Node esté corriendo.');
        }
        console.error('Error en el login:', error);
      }
    };

    return {
      credentials,
      submitLogin
    };
  }
};