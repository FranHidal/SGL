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

    // Detecta automáticamente si está en local o en el servidor
    const apiUrl = import.meta.env.VITE_API_URL;

    const submitLogin = async () => {
      try {
        // Corrección de la plantilla de texto usando backticks ``
        const response = await axios.post('/login', {
          usuario: credentials.usuario,
          password: credentials.password
        });

        // Si el servidor responde con auth: true
        if (response.data.auth) {
          const user = response.data.user;
          console.log('Sesión iniciada para:', user.nombre);
          
          // 1. GUARDADO UNIFICADO
          localStorage.setItem('user', JSON.stringify(user));
          
          // 2. REDIRECCIÓN INTELIGENTE 
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
          alert('Error de conexión. Verifica que el backend esté corriendo en: ' + apiUrl);
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