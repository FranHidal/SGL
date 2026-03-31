<template>
  <div class="gestion-container">
    <aside class="admin-menu">
      <h2>Panel Admin</h2>
      <nav>
        <button @click="vistaActual = 'crear'" :class="['nav-item', { active: vistaActual === 'crear' }]">
          Nuevo Colaborador 👤
        </button>
        <button @click="cambiarAVehiculos" :class="['nav-item', { active: vistaActual === 'vehiculos' }]">
          Gestionar Vehículos 🚛
        </button>
        <button @click="abrirAsignaciones" :class="['nav-item', { active: vistaActual === 'asignaciones' }]">
          Asignar Unidades 🔑
        </button>
        <button @click="cargarColaboradores" :class="['nav-item', { active: vistaActual === 'lista' }]">
          Lista de Personal 📋
        </button>
        <button @click="abrirTiendas" :class="['nav-item', { active: vistaActual === 'tiendas' }]">
          Gestionar Tiendas 🏬
        </button>
        <div class="menu-footer">
          <button @click="$router.push('/admin')" class="nav-item">Volver al Panel</button>
        </div>
      </nav>
    </aside>

    <main class="gestion-content">
      
      <section v-if="vistaActual === 'crear'" class="fade-in">
        <header class="content-header">
          <h1>Registro de Personal</h1>
          <p>Ingrese los datos básicos del colaborador. Si es Operador, podrá asignarle un vehículo en la pestaña correspondiente.</p>
        </header>

        <div class="form-card">
          <form @submit.prevent="registrarColaborador">
            <div class="form-grid">
              <div class="form-group">
                <label>Nombre(s)</label>
                <input v-model="form.nombre" type="text" placeholder="Ej. Juan" required />
              </div>
              <div class="form-group">
                <label>Primer Apellido</label>
                <input v-model="form.primer_apellido" type="text" placeholder="Ej. Pérez" required />
              </div>
              <div class="form-group">
                <label>Segundo Apellido</label>
                <input v-model="form.segundo_apellido" type="text" placeholder="Opcional" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="form.telefono" type="text" placeholder="9981234567" required />
              </div>
              <div class="form-group">
                <label>Perfil / Rol</label>
                <select v-model="form.id_perfil" required>
                  <option :value="null" disabled>-- Seleccione un puesto --</option>
                  <option v-for="p in perfiles" :key="p.id_perfil" :value="p.id_perfil">
                    {{ p.perfil }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Turno</label>
                <select v-model="form.turno">
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Nocturno">Nocturno</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn-save" style="margin-top: 20px;">
              Registrar Colaborador
            </button>
          </form>
        </div>
      </section>

      <section v-if="vistaActual === 'vehiculos'" class="fade-in">
        <header class="content-header">
          <h1>Flota de Vehículos</h1>
          <p>Registre las unidades antes de asignarlas a un operador.</p>
        </header>
        <div class="form-card">
          <form @submit.prevent="registrarVehiculo">
            <div class="form-grid">
              <div class="form-group"><label>Marca</label><input v-model="vehiculoForm.marca" placeholder="Chevrolet" required /></div>
              <div class="form-group"><label>Modelo</label><input v-model="vehiculoForm.modelo" placeholder="Astra" required /></div>
              <div class="form-group"><label>Matrícula</label><input v-model="vehiculoForm.matricula" placeholder="TR-00-00" required /></div>
              <div class="form-group"><label>Mantenimiento</label><input v-model="vehiculoForm.fecha_mantenimiento" type="date" required /></div>
            </div>
            <button type="submit" class="btn-save">Guardar Vehículo 🚛</button>
          </form>
        </div>
      </section>

      <section v-if="vistaActual === 'asignaciones'" class="fade-in">
        <header class="content-header">
          <h1>Asignación Operador - Unidad</h1>
          <p>Gestione qué vehículo conduce cada operador registrado en el sistema.</p>
        </header>
        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th>Unidad Actual</th>
                <th>Nueva Asignación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in listaOperadoresRelacion" :key="op.id_operador">
                <td>{{ op.nombre }} {{ op.primer_apellido }}</td>
                <td>
                  <span v-if="op.matricula" class="badge active">{{ op.marca }} {{ op.modelo }} - {{ op.matricula }}</span>
                  <span v-else class="badge danger">Sin Unidad</span>
                </td>
                <td>
                  <select v-model="op.nuevo_id_vehiculo" class="admin-select">
                    <option :value="null">-- Ninguno / A pie --</option>
                    <option v-for="v in listaVehiculos" :key="v.id_vehiculo" :value="v.id_vehiculo">
                      {{ v.marca }} {{ v.modelo }} ({{ v.matricula }})
                    </option>
                  </select>
                </td>
                <td>
                  <button @click="actualizarAsignacion(op)" class="btn-save small">Actualizar 🔄</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="listaOperadoresRelacion.length === 0" style="text-align: center; padding: 20px; color: #64748b;">
            No hay operadores registrados para asignar unidades.
          </div>
        </div>
      </section>

      <section v-if="vistaActual === 'lista'" class="fade-in">
        <header class="content-header">
          <h1>Personal Registrado</h1>
        </header>
        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Turno</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in colaboradores" :key="c.id_colaborador">
                <td>#{{ c.id_colaborador }}</td>
                <td>{{ c.nombre }} {{ c.primer_apellido }}</td>
                <td><span class="badge">{{ c.nombre_perfil }}</span></td>
                <td>{{ c.turno }}</td>
                <td>
                  <button @click="eliminarColaborador(c.id_colaborador)" class="btn-delete">Baja</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="vistaActual === 'tiendas'" class="fade-in">
        <header class="content-header">
          <h1>Directorio de Tiendas</h1>
          <p>Registre las cadenas, sucursales y sus contactos responsables.</p>
        </header>
      
        <div class="form-grid">
          <div class="form-card">
            <h3>Nueva Cadena</h3>
            <div class="form-group">
              <label>Nombre de la Cadena</label>
              <input v-model="cadenaForm.nombre_cadena" type="text" placeholder="Ej. OXXO" />
              <button @click="registrarCadena" class="btn-save" style="margin-top:10px">Agregar ➕</button>
            </div>
          </div>
        
          <div class="form-card" style="grid-column: span 2;">
            <h3>Nueva Sucursal y Responsable</h3>
            <form @submit.prevent="registrarTienda">
              <div class="form-grid">
                <div class="form-group"><label>Nombre Sucursal</label><input v-model="tiendaForm.nombre_tienda" required /></div>
                <div class="form-group">
                  <label>Cadena</label>
                  <select v-model="tiendaForm.id_cadena" required>
                    <option v-for="c in listaCadenas" :key="c.id_cadena" :value="c.id_cadena">{{ c.nombre_cadena }}</option>
                  </select>
                </div>
                <div class="form-group" style="grid-column: span 2;"><label>Dirección</label><input v-model="tiendaForm.direccion" required /></div>
                <div class="form-group"><label>Latitud</label><input v-model="tiendaForm.latitud" type="number" step="any" placeholder="21.16..." required /></div>
                <div class="form-group"><label>Longitud</label><input v-model="tiendaForm.longitud" type="number" step="any" placeholder="-86.82..." required /></div>

                <div style="grid-column: span 2; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                  <h4 style="margin-bottom: 10px; color: #3b82f6;">👤 Datos del Contacto</h4>
                </div>
                <div class="form-group"><label>Nombre Contacto</label><input v-model="tiendaForm.c_nombre" required /></div>
                <div class="form-group"><label>Apellido</label><input v-model="tiendaForm.c_primer_apellido" required /></div>
                <div class="form-group"><label>Teléfono</label><input v-model="tiendaForm.c_telefono" required /></div>
                <div class="form-group"><label>Correo Electrónico</label><input v-model="tiendaForm.c_correo" type="email" required /></div>
              </div>
              <button type="submit" class="btn-save" style="margin-top:20px">Guardar Tienda y Contacto 🏬</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const vistaActual = ref('crear');

// Datos de Estado
const perfiles = ref([]);
const listaVehiculos = ref([]);
const colaboradores = ref([]);
const listaOperadoresRelacion = ref([]);
const listaCadenas = ref([]);

// Formularios
const form = reactive({
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  telefono: '',
  id_perfil: null,
  turno: 'Matutino',
  horario: '8:00 - 16:00'
});

const vehiculoForm = reactive({
  marca: '',
  modelo: '',
  matricula: '',
  fecha_mantenimiento: ''
});

const cadenaForm = reactive({ nombre_cadena: '' });

const tiendaForm = reactive({
  nombre_tienda: '',
  direccion: '',
  latitud: null,
  longitud: null,
  id_cadena: null,
  // Campos del contacto
  c_nombre: '',
  c_primer_apellido: '',
  c_telefono: '',
  c_correo: ''
});

onMounted(() => {
  cargarCatalogos();
});

const cargarCatalogos = async () => {
  try {
    const [resP, resV, resC] = await Promise.all([
      axios.get('http://localhost:3000/api/perfiles'),
      axios.get('http://localhost:3000/api/vehiculos'),
      axios.get('http://localhost:3000/api/cadenas')
    ]);
    perfiles.value = resP.data;
    listaVehiculos.value = resV.data;
    listaCadenas.value = resC.data;
  } catch (err) { console.error("Error al cargar catálogos:", err); }
};

const registrarColaborador = async () => {
  try {
    await axios.post('http://localhost:3000/api/colaboradores', form);
    alert("Colaborador registrado exitosamente.");
    Object.assign(form, { nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', id_perfil: null, turno: 'Matutino' });
  } catch (err) { alert("Error al registrar personal"); }
};

const cambiarAVehiculos = () => {
  vistaActual.value = 'vehiculos';
  cargarCatalogos();
};

const registrarVehiculo = async () => {
  try {
    await axios.post('http://localhost:3000/api/vehiculos', vehiculoForm);
    alert("Vehículo guardado.");
    Object.assign(vehiculoForm, { marca: '', modelo: '', matricula: '', fecha_mantenimiento: '' });
    cargarCatalogos();
  } catch (err) { alert("Error al registrar vehículo"); }
};

const abrirAsignaciones = async () => {
  vistaActual.value = 'asignaciones';
  try {
    const res = await axios.get('http://localhost:3000/api/operadores-unidades');
    listaOperadoresRelacion.value = res.data.map(op => ({
      ...op,
      nuevo_id_vehiculo: op.id_vehiculo
    }));
  } catch (err) { alert("Error al cargar asignaciones"); }
};

const actualizarAsignacion = async (op) => {
  try {
    await axios.put(`http://localhost:3000/api/operadores/${op.id_operador}`, { id_vehiculo: op.nuevo_id_vehiculo });
    alert("Unidad vinculada.");
    abrirAsignaciones();
  } catch (err) { alert("Error al actualizar"); }
};

const cargarColaboradores = async () => {
  vistaActual.value = 'lista';
  const res = await axios.get('http://localhost:3000/api/colaboradores');
  colaboradores.value = res.data;
};

const eliminarColaborador = async (id) => {
  if (confirm("¿Eliminar?")) {
    await axios.delete(`http://localhost:3000/api/colaboradores/${id}`);
    cargarColaboradores();
  }
};

// --- LOGICA TIENDAS Y CADENAS ---
const abrirTiendas = async () => {
  vistaActual.value = 'tiendas';
  cargarCatalogos();
};

const registrarCadena = async () => {
  if(!cadenaForm.nombre_cadena) return;
  await axios.post('http://localhost:3000/api/cadenas', cadenaForm);
  cadenaForm.nombre_cadena = '';
  cargarCatalogos();
  alert("Cadena agregada");
};

const registrarTienda = async () => {
  // Validación básica antes de enviar
  if (!tiendaForm.id_cadena) return alert("Selecciona una cadena primero");

  try {
    const res = await axios.post('http://localhost:3000/api/tiendas', tiendaForm);
    alert("✅ " + res.data.message);
    
    // LIMPIEZA TOTAL DEL FORMULARIO
    Object.assign(tiendaForm, { 
      nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null,
      c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: ''
    });

  } catch (err) {
    console.error("Error capturado:", err.response?.data);
    alert("Error 500: Revisa la consola del servidor para ver el fallo de SQL.");
  }
};

const logout = () => { localStorage.clear(); router.push('/'); };
</script>

<style scoped src="./Gestion.css"></style>