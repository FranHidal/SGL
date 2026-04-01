<template>
  <div class="gestion-container">
    <aside class="admin-menu">
      <h2>Panel Admin 🔐</h2>
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
        <button @click="abrirAccesos" :class="['nav-item', { active: vistaActual === 'accesos' }]">
          Cuentas de Acceso 🔑
        </button>
        <div class="menu-footer">
          <button @click="$router.push('/admin')" class="nav-item">Volver al Panel</button>
          <button @click="logout" class="btn-logout-admin">Cerrar Sesión</button>
        </div>
      </nav>
    </aside>

    <main class="gestion-content">
      
      <section v-if="vistaActual === 'crear'" class="fade-in">
        <header class="content-header">
          <h1>Registro de Personal</h1>
          <p>Ingrese los datos básicos del colaborador.</p>
        </header>
        <div class="form-card">
          <form @submit.prevent="registrarColaborador">
            <div class="form-grid">
              <div class="form-group"><label>Nombre(s)</label><input v-model="form.nombre" type="text" required /></div>
              <div class="form-group"><label>Primer Apellido</label><input v-model="form.primer_apellido" type="text" required /></div>
              <div class="form-group"><label>Segundo Apellido</label><input v-model="form.segundo_apellido" type="text" /></div>
              <div class="form-group"><label>Teléfono</label><input v-model="form.telefono" type="text" required /></div>
              <div class="form-group">
                <label>Perfil / Rol</label>
                <select v-model="form.id_perfil" required>
                  <option :value="null" disabled>-- Seleccione puesto --</option>
                  <option v-for="p in perfiles" :key="p.id_perfil" :value="p.id_perfil">{{ p.perfil }}</option>
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
            <button type="submit" class="btn-save" style="margin-top: 20px;">Registrar Colaborador</button>
          </form>
        </div>
      </section>

      <section v-if="vistaActual === 'vehiculos'" class="fade-in">
        <header class="content-header"><h1>Flota de Vehículos</h1></header>
        <div class="form-card">
          <form @submit.prevent="registrarVehiculo">
            <div class="form-grid">
              <div class="form-group"><label>Marca</label><input v-model="vehiculoForm.marca" required /></div>
              <div class="form-group"><label>Modelo</label><input v-model="vehiculoForm.modelo" required /></div>
              <div class="form-group"><label>Matrícula</label><input v-model="vehiculoForm.matricula" required /></div>
              <div class="form-group"><label>Mantenimiento</label><input v-model="vehiculoForm.fecha_mantenimiento" type="date" required /></div>
            </div>
            <button type="submit" class="btn-save">Guardar Vehículo 🚛</button>
          </form>
        </div>
      </section>

      <section v-if="vistaActual === 'asignaciones'" class="fade-in">
        <header class="content-header"><h1>Asignación Operador - Unidad</h1></header>
        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr><th>Operador</th><th>Unidad Actual</th><th>Nueva Asignación</th><th>Acción</th></tr>
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
                    <option v-for="v in listaVehiculos" :key="v.id_vehiculo" :value="v.id_vehiculo">{{ v.marca }} {{ v.modelo }} ({{ v.matricula }})</option>
                  </select>
                </td>
                <td><button @click="actualizarAsignacion(op)" class="btn-save small">Actualizar 🔄</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="vistaActual === 'tiendas'" class="fade-in">
        <header class="content-header"><h1>Directorio de Tiendas</h1></header>
        <div class="form-grid">
          <div class="form-card">
            <h3>Nueva Cadena</h3>
            <div class="form-group">
              <label>Nombre de la Cadena</label>
              <input v-model="cadenaForm.nombre_cadena" type="text" />
              <button @click="registrarCadena" class="btn-save" style="margin-top:10px">Agregar ➕</button>
            </div>
          </div>
          <div class="form-card" style="grid-column: span 2;">
            <h3>Nueva Sucursal y Responsable</h3>
            <form @submit.prevent="registrarTienda">
              <div class="form-grid">
                <div class="form-group"><label>Nombre Sucursal</label><input v-model="tiendaForm.nombre_tienda" required /></div>
                <div class="form-group"><label>Cadena</label>
                  <select v-model="tiendaForm.id_cadena" required>
                    <option v-for="c in listaCadenas" :key="c.id_cadena" :value="c.id_cadena">{{ c.nombre_cadena }}</option>
                  </select>
                </div>
                <div class="form-group" style="grid-column: span 2;"><label>Dirección</label><input v-model="tiendaForm.direccion" required /></div>
                <div class="form-group"><label>Latitud</label><input v-model="tiendaForm.latitud" type="number" step="any" required /></div>
                <div class="form-group"><label>Longitud</label><input v-model="tiendaForm.longitud" type="number" step="any" required /></div>
                <div style="grid-column: span 2; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                  <h4 style="color: #3b82f6;">👤 Datos del Contacto</h4>
                </div>
                <div class="form-group"><label>Nombre</label><input v-model="tiendaForm.c_nombre" required /></div>
                <div class="form-group"><label>Apellido</label><input v-model="tiendaForm.c_primer_apellido" required /></div>
                <div class="form-group"><label>Teléfono</label><input v-model="tiendaForm.c_telefono" required /></div>
                <div class="form-group"><label>Correo</label><input v-model="tiendaForm.c_correo" type="email" required /></div>
              </div>
              <button type="submit" class="btn-save" style="margin-top:20px">Guardar Tienda y Contacto 🏬</button>
            </form>
          </div>
        </div>
      </section>

      <section v-if="vistaActual === 'accesos'" class="fade-in">
        <header class="content-header"><h1>Cuentas de Acceso</h1><p>Active las credenciales para el personal.</p></header>
        <div class="form-card">
          <form @submit.prevent="crearAcceso">
            <div class="form-grid">
              <div class="form-group">
                <label>Colaborador</label>
                <select v-model="accesoForm.id_colaborador" required>
                  <option :value="null" disabled>-- Seleccione personal --</option>
                  <option v-for="col in listaSinAcceso" :key="col.id_colaborador" :value="col.id_colaborador">{{ col.nombre }} {{ col.primer_apellido }} ({{ col.perfil }})</option>
                </select>
              </div>
              <div class="form-group"><label>Usuario</label><input v-model="accesoForm.usuario" required /></div>
              <div class="form-group"><label>Contraseña</label><input v-model="accesoForm.contrasena" type="password" required /></div>
              <div class="form-group">
                <label>Rol</label>
                <select v-model="accesoForm.rol" required>
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn-save" style="margin-top: 20px;">Activar Acceso 🚀</button>
          </form>
        </div>
      </section>

      <section v-if="vistaActual === 'lista'" class="fade-in">
        <header class="content-header"><h1>Personal Registrado</h1></header>
        <div class="table-card">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Puesto</th><th>Turno</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr v-for="c in colaboradores" :key="c.id_colaborador">
                <td>#{{ c.id_colaborador }}</td>
                <td>{{ c.nombre }} {{ c.primer_apellido }}</td>
                <td><span class="badge">{{ c.nombre_perfil }}</span></td>
                <td>{{ c.turno }}</td>
                <td><button @click="eliminarColaborador(c.id_colaborador)" class="btn-delete">Baja</button></td>
              </tr>
            </tbody>
          </table>
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
const listaSinAcceso = ref([]);

// Formularios
const form = reactive({ nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', id_perfil: null, turno: 'Matutino' });
const vehiculoForm = reactive({ marca: '', modelo: '', matricula: '', fecha_mantenimiento: '' });
const cadenaForm = reactive({ nombre_cadena: '' });
const tiendaForm = reactive({ nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null, c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: '' });
const accesoForm = reactive({ id_colaborador: null, usuario: '', contrasena: '', rol: 'operador' });

onMounted(() => { cargarCatalogos(); });

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
  } catch (err) { console.error(err); }
};

const registrarColaborador = async () => {
  try {
    await axios.post('http://localhost:3000/api/colaboradores', form);
    alert("Colaborador registrado exitosamente.");
    Object.assign(form, { nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', id_perfil: null });
  } catch (err) { alert("Error al registrar personal"); }
};

const cambiarAVehiculos = () => { vistaActual.value = 'vehiculos'; cargarCatalogos(); };

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
  const res = await axios.get('http://localhost:3000/api/operadores-unidades');
  listaOperadoresRelacion.value = res.data.map(op => ({ ...op, nuevo_id_vehiculo: op.id_vehiculo }));
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

const abrirTiendas = () => { vistaActual.value = 'tiendas'; cargarCatalogos(); };

const registrarCadena = async () => {
  await axios.post('http://localhost:3000/api/cadenas', cadenaForm);
  cadenaForm.nombre_cadena = '';
  cargarCatalogos();
};

const registrarTienda = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/tiendas', tiendaForm);
    alert("✅ " + res.data.message);
    Object.assign(tiendaForm, { nombre_tienda: '', direccion: '', latitud: null, longitud: null, id_cadena: null, c_nombre: '', c_primer_apellido: '', c_telefono: '', c_correo: '' });
  } catch (err) { alert("Error al registrar tienda"); }
};

const abrirAccesos = async () => {
  vistaActual.value = 'accesos';
  const res = await axios.get('http://localhost:3000/api/colaboradores-sin-acceso');
  listaSinAcceso.value = res.data;
};

const crearAcceso = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/usuarios/crear', accesoForm);
    alert(res.data.message);
    Object.assign(accesoForm, { id_colaborador: null, usuario: '', contrasena: '', rol: 'operador' });
    abrirAccesos();
  } catch (err) { alert(err.response?.data?.error || "Error"); }
};

const logout = () => { localStorage.clear(); router.push('/'); };
</script>

<style scoped src="./Gestion.css"></style>