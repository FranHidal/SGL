const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { exec } = require('child_process'); // Necesario para ejecutar Python

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
    const { nombre, primer_apellido, segundo_apellido, telefono, id_perfil, turno, horario } = req.body;
    const queryCol = `INSERT INTO Colaborador (nombre, primer_apellido, segundo_apellido, telefono, id_perfil, turno, horario) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(queryCol, [nombre, primer_apellido, segundo_apellido, telefono, id_perfil, turno, horario], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const nuevoIdColaborador = result.insertId;

        if (id_perfil == 1) { 
            const queryOp = `INSERT INTO Operador (id_colaborador, id_vehiculo) VALUES (?, NULL)`;
            db.query(queryOp, [nuevoIdColaborador], (errOp) => {
                if (errOp) console.error("Error en Operador:", errOp.message);
                else console.log(`✅ Operador #${nuevoIdColaborador} vinculado.`);
            });
        }
        res.status(201).json({ message: "✅ Colaborador registrado", id: nuevoIdColaborador });
    });
});

app.get('/api/colaboradores', (req, res) => {
    db.query(`SELECT c.*, p.perfil as nombre_perfil FROM Colaborador c JOIN Perfil p ON c.id_perfil = p.id_perfil`, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- GESTIÓN DE ASIGNACIONES ---
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
    db.query('UPDATE Operador SET id_vehiculo = ? WHERE id_operador = ?', [req.body.id_vehiculo, req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Asignación actualizada" });
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
    db.query('INSERT INTO Vehiculo (marca, modelo, matricula, fecha_mantenimiento) VALUES (?, ?, ?, ?)', [marca, modelo, matricula, fecha_mantenimiento], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Vehículo creado" });
    });
});

// --- TIENDAS Y CONTACTOS ---
app.post('/api/cadenas', (req, res) => {
    db.query('INSERT INTO Cadena (nombre_cadena) VALUES (?)', [req.body.nombre_cadena], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Cadena registrada" });
    });
});

app.get('/api/cadenas', (req, res) => {
    db.query('SELECT * FROM Cadena', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/api/tiendas', (req, res) => {
    const { nombre_tienda, direccion, longitud, latitud, id_cadena, c_nombre, c_primer_apellido, c_telefono, c_correo } = req.body;
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    db.query(`INSERT INTO Contacto (nombre, primer_apellido, telefono, correo_electronico) VALUES (?, ?, ?, ?)`, [c_nombre, c_primer_apellido, c_telefono, c_correo], (err, result) => {
        if (err) return res.status(500).json({ error: "Error en Contacto" });
        const idContacto = result.insertId;
        db.query(`INSERT INTO Tienda (nombre_tienda, direccion, longitud, latitud, id_cadena, id_contacto) VALUES (?, ?, ?, ?, ?, ?)`, [nombre_tienda, direccion, lng, lat, id_cadena, idContacto], (errT) => {
            if (errT) return res.status(500).json({ error: "Error en Tienda" });
            res.status(201).json({ message: "✅ Tienda y Contacto registrados" });
        });
    });
});

app.get('/api/tiendas', (req, res) => {
    const query = `SELECT t.*, c.nombre_cadena, con.nombre as contacto_nombre FROM Tienda t JOIN Cadena c ON t.id_cadena = c.id_cadena LEFT JOIN Contacto con ON t.id_contacto = con.id_contacto`;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- GESTIÓN DE ACCESOS ---

// Listar colaboradores que NO tienen cuenta aún
app.get('/api/colaboradores-sin-acceso', (req, res) => {
    const query = `
        SELECT c.id_colaborador, c.nombre, c.primer_apellido, p.perfil
        FROM Colaborador c
        JOIN Perfil p ON c.id_perfil = p.id_perfil
        LEFT JOIN Usuarios u ON c.id_colaborador = u.id_colaborador
        WHERE u.id_usuario IS NULL
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// Crear usuario (Recuerda que el ROL debe coincidir con tu ENUM: 'admin' o 'operador')
app.post('/api/usuarios/crear', (req, res) => {
    const { id_colaborador, usuario, contrasena, rol } = req.body;
    const query = `INSERT INTO Usuarios (id_colaborador, usuario, contrasena, rol) VALUES (?, ?, ?, ?)`;
    
    db.query(query, [id_colaborador, usuario, contrasena, rol], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Ese nombre de usuario ya está ocupado." });
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "✅ Cuenta activada exitosamente" });
    });
});

// --- MÓDULO DE RUTAS (OPTIMIZACIÓN AUTOMÁTICA) ---
app.post('/api/rutas/generar', (req, res) => {
    const { id_operador, tiendas } = req.body;
    if (!tiendas || tiendas.length === 0) return res.status(400).send("No hay tiendas");

    // Agregamos optimizada = 0 por defecto
    const queryRuta = `INSERT INTO Ruta (fecha_creacion, id_operador, optimizada) VALUES (CURRENT_DATE, ?, 0)`;

    db.query(queryRuta, [id_operador], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const idRuta = result.insertId;
        const values = tiendas.map((id, idx) => [idRuta, id, idx + 1]);

        db.query(`INSERT INTO Ruta_Detalle (id_ruta, id_tienda, orden) VALUES ?`, [values], (errDet) => {
            if (errDet) return res.status(500).json({ error: errDet.message });
            
            // LLAMADA AL OPTIMIZADOR PYTHON
            console.log(`🤖 Despertando VSP para ruta #${idRuta}...`);
            exec(`python ../AI-worker/VSP.py`, (error, stdout) => {
                if (error) console.error(`❌ Python Error: ${error.message}`);
                else console.log(`✅ Python Output: ${stdout}`);
            });

            res.status(201).json({ message: "✅ Ruta generada. Optimizando...", id_ruta: idRuta });
        });
    });
});

// NUEVO: Obtener ruta optimizada para el mapa del operador
app.get('/api/operador/mi-ruta/:id_colaborador', (req, res) => {
    const query = `
        SELECT 
            rd.orden, 
            t.id_tienda, 
            t.nombre_tienda, 
            t.latitud, 
            t.longitud, 
            rd.id_ruta_detalle, 
            rd.id_ruta,
            t.id_cadena,
            IFNULL(c.nombre_cadena, 'Sin Cadena') as nombre_cadena,
            v.matricula -- 👈 Aprovechamos para traer la matrícula si existe
        FROM Ruta r
        JOIN Operador o ON r.id_operador = o.id_operador
        LEFT JOIN Vehiculo v ON o.id_vehiculo = v.id_vehiculo -- 👈 Para la unidad
        JOIN Ruta_Detalle rd ON r.id_ruta = rd.id_ruta
        JOIN Tienda t ON rd.id_tienda = t.id_tienda
        LEFT JOIN Cadena c ON t.id_cadena = c.id_cadena -- 👈 LEFT JOIN es la clave
        WHERE o.id_colaborador = ? 
        ORDER BY r.id_ruta DESC, rd.orden ASC
        LIMIT 50
    `;
    db.query(query, [req.params.id_colaborador], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- CATÁLOGOS ---
app.get('/api/perfiles', (req, res) => {
    db.query('SELECT * FROM Perfil', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- BITÁCORA ---
app.post('/api/bitacora', (req, res) => {
    const { id_ruta, hora_llegada, id_tienda, id_cadena, folio, perecedero, bazar, peso, peso_salida, fecha, comentarios, id_operador, no_perecedero } = req.body;
    const query = `INSERT INTO Bitacora (id_ruta, hora_llegada, id_tienda, id_cadena, folio, perecedero, bazar, peso, peso_salida, fecha, comentarios, id_operador, no_perecedero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [id_ruta, hora_llegada, id_tienda, id_cadena, folio, perecedero, bazar, peso, peso_salida, fecha, comentarios, id_operador, no_perecedero], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Registro exitoso", id: result.insertId });
    });
});

app.listen(3000, () => console.log('🚀 Servidor logística Cancún en puerto 3000'));