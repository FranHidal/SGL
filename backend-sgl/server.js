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
        if (result.length > 0) res.send({ auth: true, user: result[0] });
        else res.status(401).send({ auth: false, message: 'Credenciales inválidas' });
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
            db.query(`INSERT INTO Operador (id_colaborador, id_vehiculo) VALUES (?, NULL)`, [nuevoIdColaborador]);
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

app.delete('/api/colaboradores/:id', (req, res) => {
    db.query('DELETE FROM Colaborador WHERE id_colaborador = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Colaborador eliminado" });
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

// --- ASIGNACIONES DE UNIDADES ---
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

// --- TIENDAS Y CADENAS ---
app.get('/api/cadenas', (req, res) => {
    db.query('SELECT * FROM Cadena', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/api/tiendas', (req, res) => {
    const { nombre_tienda, direccion, longitud, latitud, id_cadena, c_nombre, c_primer_apellido, c_telefono, c_correo } = req.body;
    db.query(`INSERT INTO Contacto (nombre, primer_apellido, telefono, correo_electronico) VALUES (?, ?, ?, ?)`, [c_nombre, c_primer_apellido, c_telefono, c_correo], (err, result) => {
        if (err) return res.status(500).json({ error: "Error en Contacto" });
        const idContacto = result.insertId;
        db.query(`INSERT INTO Tienda (nombre_tienda, direccion, longitud, latitud, id_cadena, id_contacto) VALUES (?, ?, ?, ?, ?, ?)`, [nombre_tienda, direccion, longitud, latitud, id_cadena, idContacto], (errT) => {
            if (errT) return res.status(500).json({ error: "Error en Tienda" });
            res.status(201).json({ message: "Tienda y Contacto registrados" });
        });
    });
});

app.get('/api/tiendas', (req, res) => {
    const query = `
        SELECT t.*, c.nombre_cadena 
        FROM Tienda t
        INNER JOIN Cadena c ON t.id_cadena = c.id_cadena
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- cREACIÓN Y OPTIMIZACIÓN DE RUTAS ---
app.post('/api/rutas/generar', (req, res) => {
    const { id_operador, tiendas } = req.body; 
    const fecha = new Date().toISOString().split('T')[0];

    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err.message });

        const queryRuta = `INSERT INTO Ruta (fecha_creacion, id_operador, optimizada) VALUES (?, ?, 0)`;
        db.query(queryRuta, [fecha, id_operador], (errR, result) => {
            if (errR) return db.rollback(() => res.status(500).json({ error: errR.message }));

            const nuevoIdRuta = result.insertId;
            const valoresDetalle = tiendas.map((id_tienda, index) => [nuevoIdRuta, id_tienda, index + 1]);

            const queryDetalle = `INSERT INTO Ruta_Detalle (id_ruta, id_tienda, orden) VALUES ?`;
            db.query(queryDetalle, [valoresDetalle], (errD) => {
                if (errD) return db.rollback(() => res.status(500).json({ error: errD.message }));

                db.commit((errC) => {
                    if (errC) return db.rollback(() => res.status(500).json({ error: errC.message }));

                    exec(`python ../AI-worker/VSP.py`, (pyErr, stdout, stderr) => {
                        if (pyErr) {
                            console.error("❌ ERROR CRÍTICO EN PYTHON:");
                            console.error(stderr); // Aquí verás el Traceback real (el error de código)
                        }
                        if (stdout) {
                            console.log("🐍 MENSAJE DE PYTHON:");
                            console.log(stdout); // Aquí verás tus prints de "Optimizando..."
                        }
                    });

                    res.status(201).json({ message: `✅ Ruta #${nuevoIdRuta} creada.` });
                });
            });
        });
    });
});

// --- VISUALIZACIÓN DE RUTAS ---
app.get('/api/rutas/historial', (req, res) => {
    const query = `
        SELECT 
            r.id_ruta, 
            r.fecha_creacion, 
            r.optimizada,
            c.nombre AS nombre_operador,
            c.primer_apellido,
            GROUP_CONCAT(t.nombre_tienda ORDER BY rd.orden SEPARATOR ' ➔ ') AS itinerario
        FROM Ruta r
        JOIN Operador o ON r.id_operador = o.id_operador
        JOIN Colaborador c ON o.id_colaborador = c.id_colaborador
        JOIN Ruta_Detalle rd ON r.id_ruta = rd.id_ruta
        JOIN Tienda t ON rd.id_tienda = t.id_tienda
        GROUP BY r.id_ruta
        ORDER BY r.id_ruta DESC
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.delete('/api/rutas/:id', (req, res) => {
    const id_ruta = req.params.id;

    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 1. Borrar primero los detalles (por la llave foránea)
        db.query('DELETE FROM Ruta_Detalle WHERE id_ruta = ?', [id_ruta], (errD) => {
            if (errD) return db.rollback(() => res.status(500).json({ error: errD.message }));

            // 2. Borrar la ruta principal
            db.query('DELETE FROM Ruta WHERE id_ruta = ?', [id_ruta], (errR) => {
                if (errR) return db.rollback(() => res.status(500).json({ error: errR.message }));

                db.commit((errC) => {
                    if (errC) return db.rollback(() => res.status(500).json({ error: errC.message }));
                    res.send({ message: `✅ Ruta #${id_ruta} eliminada correctamente.` });
                });
            });
        });
    });
});

// --- RUTAS PARA EL OPERADOR (MAPA) ---
app.get('/api/operador/mi-ruta/:id_colaborador', (req, res) => {
    const query = `
        SELECT rd.orden, t.id_tienda, t.nombre_tienda, t.latitud, t.longitud, 
               rd.id_ruta_detalle, rd.id_ruta, o.id_operador, t.id_cadena, 
               c.nombre_cadena
        FROM Ruta r
        JOIN Operador o ON r.id_operador = o.id_operador
        JOIN Ruta_Detalle rd ON r.id_ruta = rd.id_ruta
        JOIN Tienda t ON rd.id_tienda = t.id_tienda
        LEFT JOIN Cadena c ON t.id_cadena = c.id_cadena
        WHERE o.id_colaborador = ? 
          AND r.fecha_creacion >= CURDATE()
        ORDER BY r.id_ruta DESC, rd.orden ASC
    `;
    db.query(query, [req.params.id_colaborador], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- PARADAS COMPLETADAS ---
app.get('/api/operador/paradas-completadas/:id_colaborador', (req, res) => {
    const query = `
        SELECT DISTINCT b.id_tienda 
        FROM Bitacora b
        WHERE b.id_ruta = (
            SELECT MAX(id_ruta) 
            FROM Ruta r 
            JOIN Operador o ON r.id_operador = o.id_operador 
            WHERE o.id_colaborador = ?
        )
    `;
    db.query(query, [req.params.id_colaborador], (err, result) => {
        if (err) return res.status(500).send(err);
        const ids = result.map(row => row.id_tienda);
        res.send(ids);
    });
});

// --- BITÁCORA ---
app.post('/api/bitacora', (req, res) => {
        const { 
        id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, 
        folio, fecha, comentarios, id_operador, 
        perecedero, no_perecedero, bazar 
    } = req.body;

    const registros = [];

    if (parseFloat(perecedero) > 0) {
        registros.push([id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, parseFloat(perecedero), fecha, comentarios, id_operador, 'Perecedero']);
    }
    if (parseFloat(no_perecedero) > 0) {
        registros.push([id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, parseFloat(no_perecedero), fecha, comentarios, id_operador, 'No Perecedero']);
    }
    if (parseFloat(bazar) > 0) {
        registros.push([id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, parseFloat(bazar), fecha, comentarios, id_operador, 'Bazar']);
    }

    if (registros.length === 0) return res.status(400).json({ error: "Ingrese al menos un peso" });

    const query = `
        INSERT INTO Bitacora 
        (id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, peso, fecha, comentarios, id_operador, categoria) 
        VALUES ?
    `;

    db.query(query, [registros], (err, result) => {
        if (err) {
            console.error("Error al insertar en Bitacora:", err); // Para que veas el error real en la consola de Laragon
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: `✅ Éxito: ${result.affectedRows} registros creados.` });
    });
});

// --- CATÁLOGOS ---
app.get('/api/perfiles', (req, res) => {
    db.query('SELECT * FROM Perfil', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.listen(3000, () => console.log('🚀 Servidor Cáritas Cancún en puerto 3000'));