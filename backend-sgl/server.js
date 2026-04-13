const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { exec } = require('child_process');

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

// --- MÓDULO DE RUTAS ---
app.post('/api/rutas/generar', (req, res) => {
    const { id_operador, tiendas } = req.body;
    if (!tiendas || tiendas.length === 0) return res.status(400).send("No hay tiendas");

    const queryRuta = `INSERT INTO Ruta (fecha_creacion, id_operador, optimizada) VALUES (CURRENT_DATE, ?, 0)`;

    db.query(queryRuta, [id_operador], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const idRuta = result.insertId;
        const values = tiendas.map((id, idx) => [idRuta, id, idx + 1]);

        db.query(`INSERT INTO Ruta_Detalle (id_ruta, id_tienda, orden) VALUES ?`, [values], (errDet) => {
            if (errDet) return res.status(500).json({ error: errDet.message });
            
            console.log(`🤖 Despertando VSP para ruta #${idRuta}...`);
            exec(`python ../AI-worker/VSP.py`, (error, stdout) => {
                if (error) console.error(`❌ Python Error: ${error.message}`);
                else console.log(`✅ Python Output: ${stdout}`);
            });

            res.status(201).json({ message: "✅ Ruta generada. Optimizando...", id_ruta: idRuta });
        });
    });
});

app.get('/api/operador/mi-ruta/:id_colaborador', (req, res) => {
    const query = `
        SELECT 
            rd.orden, t.id_tienda, t.nombre_tienda, t.latitud, t.longitud, 
            rd.id_ruta_detalle, rd.id_ruta, o.id_operador, 
            t.id_cadena, IFNULL(c.nombre_cadena, 'Sin Cadena') as nombre_cadena,
            v.matricula
        FROM Ruta r
        JOIN Operador o ON r.id_operador = o.id_operador
        LEFT JOIN Vehiculo v ON o.id_vehiculo = v.id_vehiculo 
        JOIN Ruta_Detalle rd ON r.id_ruta = rd.id_ruta
        JOIN Tienda t ON rd.id_tienda = t.id_tienda
        LEFT JOIN Cadena c ON t.id_cadena = c.id_cadena
        WHERE o.id_colaborador = ? 
        ORDER BY r.id_ruta DESC, rd.orden ASC
        LIMIT 50
    `;
    db.query(query, [req.params.id_colaborador], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- BITÁCORA (MULTI-REGISTRO CORREGIDO) ---
app.post('/api/bitacora', (req, res) => {
    const { 
        id_ruta, hora_llegada, id_tienda, id_cadena, folio, 
        fecha, comentarios, id_operador,
        perecedero, no_perecedero, bazar 
    } = req.body;

    // Registros individuales
    const registros = [];

    // Si hay perecedero, creamos una fila donde el peso es la cantidad de perecedero
    if (parseFloat(perecedero) > 0) {
        registros.push([id_ruta, hora_llegada, id_tienda, id_cadena, folio, parseFloat(perecedero), fecha, comentarios, id_operador, 'Perecedero']);
    }
    // Si hay no perecedero, otra fila con ese peso
    if (parseFloat(no_perecedero) > 0) {
        registros.push([id_ruta, hora_llegada, id_tienda, id_cadena, folio, parseFloat(no_perecedero), fecha, comentarios, id_operador, 'No Perecedero']);
    }
    // Si hay bazar, otra fila con ese peso
    if (parseFloat(bazar) > 0) {
        registros.push([id_ruta, hora_llegada, id_tienda, id_cadena, folio, parseFloat(bazar), fecha, comentarios, id_operador, 'Bazar']);
    }

    if (registros.length === 0) {
        return res.status(400).json({ error: "Debe ingresar al menos un peso mayor a 0" });
    }

    // IMPORTANTE: Solo insertamos en estas columnas. 
    // Las columnas individuales (perecedero, bazar, etc.) se quedarán en su valor por defecto (0 o NULL)
    const query = `INSERT INTO Bitacora 
        (id_ruta, hora_llegada, id_tienda, id_cadena, folio, peso, fecha, comentarios, id_operador, categoria) 
        VALUES ?`;

    db.query(query, [registros], (err, result) => {
        if (err) {
            console.error("❌ Error en MySQL:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            message: `✅ Éxito: Se generaron ${result.affectedRows} registros.` 
        });
    });
});