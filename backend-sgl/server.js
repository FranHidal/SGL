const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Conexión a la BD
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'sgl_bd'
});

db.connect(err => {
    if (err) throw err;
    console.log('✅ Conectado a la base de datos MySQL');
});

// --- LOGIN ---
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    const query = `
        SELECT u.usuario, u.rol, c.nombre, c.id_colaborador
        FROM Usuarios u
        JOIN Colaborador c ON u.id_colaborador = c.id_colaborador
        WHERE u.usuario = ? AND u.contrasena = ?
    `;
    db.query(query, [usuario, password], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) {
            res.send({ auth: true, user: result[0] });
        } else {
            res.status(401).send({ auth: false, message: 'Credenciales inválidas' });
        }
    });
});

// --- COLABORADORES ---

app.post('/api/colaboradores', (req, res) => {
    const { 
        nombre, primer_apellido, segundo_apellido, 
        telefono, id_perfil, turno, horario 
    } = req.body;

    const queryCol = `INSERT INTO Colaborador 
        (nombre, primer_apellido, segundo_apellido, telefono, id_perfil, turno, horario) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(queryCol, [nombre, primer_apellido, segundo_apellido, telefono, id_perfil, turno, horario], (err, result) => {
        if (err) {
            console.error("Error al insertar colaborador:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        const nuevoIdColaborador = result.insertId;

        // Si el perfil es 'Operador' (Verifica si en tu BD es el ID 1 o 2)
        if (id_perfil == 1) { 
            const queryOp = `INSERT INTO Operador (id_colaborador, id_vehiculo) VALUES (?, NULL)`;
            db.query(queryOp, [nuevoIdColaborador], (errOp) => {
                if (errOp) console.error("Error al crear registro en tabla Operador:", errOp.message);
                else console.log(`✅ Operador #${nuevoIdColaborador} vinculado correctamente.`);
            });
        }

        res.status(201).json({ message: "✅ Colaborador registrado exitosamente", id: nuevoIdColaborador });
    });
});

app.get('/api/colaboradores', (req, res) => {
    const query = `SELECT c.*, p.perfil as nombre_perfil FROM Colaborador c JOIN Perfil p ON c.id_perfil = p.id_perfil`;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.delete('/api/colaboradores/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Colaborador WHERE id_colaborador = ?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Colaborador eliminado" });
    });
});

// --- GESTIÓN DE ASIGNACIONES (OPERADOR - VEHÍCULO) ---

app.get('/api/operadores-unidades', (req, res) => {
    const query = `
        SELECT o.id_operador, c.nombre, c.primer_apellido, v.id_vehiculo, v.marca, v.modelo, v.matricula
        FROM Operador o
        JOIN Colaborador c ON o.id_colaborador = c.id_colaborador
        LEFT JOIN Vehiculo v ON o.id_vehiculo = v.id_vehiculo
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.put('/api/operadores/:id', (req, res) => {
    const { id } = req.params;
    const { id_vehiculo } = req.body;
    const query = 'UPDATE Operador SET id_vehiculo = ? WHERE id_operador = ?';
    db.query(query, [id_vehiculo, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Asignación actualizada correctamente" });
    });
});

// --- VEHÍCULOS ---

app.get('/api/vehiculos', (req, res) => {
    db.query('SELECT * FROM Vehiculo', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/api/vehiculos', (req, res) => {
    const { marca, modelo, matricula, fecha_mantenimiento } = req.body;
    const query = 'INSERT INTO Vehiculo (marca, modelo, matricula, fecha_mantenimiento) VALUES (?, ?, ?, ?)';
    db.query(query, [marca, modelo, matricula, fecha_mantenimiento], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Vehículo creado" });
    });
});

// --- GESTIÓN DE TIENDAS Y CADENAS (INCLUYE CONTACTO) ---

app.get('/api/cadenas', (req, res) => {
    db.query('SELECT * FROM Cadena', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/api/cadenas', (req, res) => {
    const { nombre_cadena } = req.body;
    db.query('INSERT INTO Cadena (nombre_cadena) VALUES (?)', [nombre_cadena], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Cadena registrada", id: result.insertId });
    });
});

// Registrar Tienda + Contacto
app.post('/api/tiendas', (req, res) => {
    const { 
        nombre_tienda, direccion, longitud, latitud, id_cadena,
        c_nombre, c_primer_apellido, c_telefono, c_correo 
    } = req.body;

    // Convertimos explícitamente a número por si Axios los mandó como String
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    const queryCon = `INSERT INTO Contacto (nombre, primer_apellido, telefono, correo_electronico) VALUES (?, ?, ?, ?)`;
    
    db.query(queryCon, [c_nombre, c_primer_apellido, c_telefono, c_correo], (err, result) => {
        if (err) return res.status(500).json({ error: "Error en Contacto: " + err.message });

        const idContacto = result.insertId;

        const queryTienda = `INSERT INTO Tienda (nombre_tienda, direccion, longitud, latitud, id_cadena, id_contacto) 
                             VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.query(queryTienda, [nombre_tienda, direccion, lng, lat, id_cadena, idContacto], (errT) => {
            if (errT) return res.status(500).json({ error: "Error en Tienda (Revisa decimales): " + errT.message });
            
            res.status(201).json({ message: "✅ Tienda y Contacto registrados exitosamente" });
        });
    });
});

app.get('/api/tiendas', (req, res) => {
    const query = `
        SELECT t.*, c.nombre_cadena, con.nombre as contacto_nombre, con.telefono as contacto_tel
        FROM Tienda t
        JOIN Cadena c ON t.id_cadena = c.id_cadena
        LEFT JOIN Contacto con ON t.id_contacto = con.id_contacto
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- MÓDULO DE PLANIFICACIÓN DE RUTAS ---

app.post('/api/rutas/generar', (req, res) => {
    const { id_operador, tiendas } = req.body; // tiendas: array de id_tienda

    if (!tiendas || tiendas.length === 0) return res.status(400).send("No hay tiendas seleccionadas");

    // 1. Crear la cabecera de la Ruta
    const queryRuta = `INSERT INTO Ruta (fecha_creacion, id_operador) VALUES (CURRENT_DATE, ?)`;

    db.query(queryRuta, [id_operador], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const idRutaGenerada = result.insertId;

        // 2. Crear el detalle (Insert Masivo)
        // Por ahora el 'orden' es simplemente el índice del arreglo
        const values = tiendas.map((id_tienda, index) => [idRutaGenerada, id_tienda, index + 1]);

        const queryDetalle = `INSERT INTO Ruta_Detalle (id_ruta, id_tienda, orden) VALUES ?`;

        db.query(queryDetalle, [values], (errDetalle) => {
            if (errDetalle) return res.status(500).json({ error: errDetalle.message });
            
            res.status(201).json({ 
                message: "✅ Ruta generada con éxito", 
                id_ruta: idRutaGenerada 
            });
        });
    });
});

// --- CATÁLOGOS ---

app.get('/api/perfiles', (req, res) => {
    db.query('SELECT * FROM Perfil', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- OPERACIONES (BITÁCORA) ---

app.post('/api/bitacora', (req, res) => {
    const { 
        id_ruta, hora_llegada, id_tienda, id_cadena, folio, 
        perecedero, bazar, peso, peso_salida, fecha, comentarios, id_operador 
    } = req.body;

    const query = `INSERT INTO Bitacora 
        (id_ruta, hora_llegada, id_tienda, id_cadena, folio, perecedero, bazar, peso, peso_salida, fecha, comentarios, id_operador) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [id_ruta, hora_llegada, id_tienda, id_cadena, folio, perecedero, bazar, peso, peso_salida, fecha, comentarios, id_operador];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Registro exitoso", id: result.insertId });
    });
});

// 4. Encendido del Servidor
app.listen(3000, () => console.log('🚀 Servidor logística corriendo en puerto 3000'));