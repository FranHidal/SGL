require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Conexión a la BD
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SICA_BD',
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) throw err;
    console.log('✅ Conectado a la base de datos MySQL');
});

// 2. Creación del Enrutador Global para agrupar bajo /api
const apiRouter = express.Router();

// --- LOGIN ---
apiRouter.post('/login', (req, res) => {
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
apiRouter.post('/colaboradores', (req, res) => {
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

apiRouter.get('/colaboradores', (req, res) => {
    db.query(`SELECT c.*, p.perfil as nombre_perfil FROM Colaborador c JOIN Perfil p ON c.id_perfil = p.id_perfil`, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

apiRouter.delete('/colaboradores/:id', (req, res) => {
    db.query('DELETE FROM Colaborador WHERE id_colaborador = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Colaborador eliminado" });
    });
});

// --- VEHÍCULOS ---
apiRouter.get('/vehiculos', (req, res) => {
    db.query('SELECT * FROM Vehiculo', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

apiRouter.post('/vehiculos', (req, res) => {
    const { marca, modelo, matricula, fecha_mantenimiento } = req.body;
    db.query('INSERT INTO Vehiculo (marca, modelo, matricula, fecha_mantenimiento) VALUES (?, ?, ?, ?)', [marca, modelo, matricula, fecha_mantenimiento], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Vehículo creado" });
    });
});

// --- ASIGNACIONES DE UNIDADES ---
apiRouter.get('/operadores-unidades', (req, res) => {
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

apiRouter.post('/operadores/:id', (req, res) => {
    db.query('UPDATE Operador SET id_vehiculo = ? WHERE id_operador = ?', [req.body.id_vehiculo, req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al actualizar" });
        }
        res.send({ message: "Asignación actualizada" });
    });
});

// OBTENER COLABORADORES SIN ACCESO
apiRouter.get('/colaboradores-sin-acceso', (req, res) => {
    const query = `
        SELECT 
            c.id_colaborador, 
            c.nombre, 
            c.primer_apellido, 
            p.perfil 
        FROM Colaborador c
        INNER JOIN Perfil p ON c.id_perfil = p.id_perfil
        LEFT JOIN Usuarios u ON c.id_colaborador = u.id_colaborador
        WHERE u.id_usuario IS NULL
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener lista" });
        }
        res.json(results);
    });
});

// CREACION DE USUARIOS
apiRouter.post('/usuarios/crear', (req, res) => {
    const { id_colaborador, usuario, contrasena, rol } = req.body;

    const rolesPermitidos = ['admin', 'operador', 'director', 'almacen', 'adminvo', 'desarrollo'];
    const rolSeguro = rolesPermitidos.includes(rol) ? rol : 'operador';

    const query = `
        INSERT INTO Usuarios (id_colaborador, usuario, contrasena, rol) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [id_colaborador, usuario, contrasena, rolSeguro], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Ese nombre de usuario ya existe" });
            }
            return res.status(500).json({ error: "Error al crear cuenta" });
        }
        res.json({ message: "¡Acceso activado correctamente! 🚀" });
    });
});

// --- TIENDAS Y CADENAS ---
apiRouter.get('/cadenas', (req, res) => {
    db.query('SELECT * FROM Cadena', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

apiRouter.post('/tiendas', (req, res) => {
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

apiRouter.get('/tiendas', (req, res) => {
    const query = `
        SELECT 
            t.id_tienda, 
            t.nombre_tienda, 
            t.direccion, 
            t.longitud, 
            t.latitud,
            c.id_cadena,
            c.nombre_cadena,
            t.id_contacto,
            co.nombre AS contacto_nombre,
            co.primer_apellido AS contacto_apellido,
            co.telefono,
            co.correo_electronico
        FROM Tienda t
        INNER JOIN Cadena c ON t.id_cadena = c.id_cadena
        INNER JOIN Contacto co ON t.id_contacto = co.id_contacto
        ORDER BY t.id_tienda DESC
    `;
    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al consultar directorio de tiendas:", err);
            return res.status(500).send(err);
        }
        res.send(result);
    });
});

apiRouter.delete('/tiendas/:id_tienda/:id_contacto', (req, res) => {
    const { id_tienda, id_contacto } = req.params;

    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Paso A: Borramos primero la tienda por integridad referencial
        db.query('DELETE FROM Tienda WHERE id_tienda = ?', [id_tienda], (errT) => {
            if (errT) {
                return db.rollback(() => {
                    // Si da error de llave foránea es porque está vinculada a un Ruta_Detalle activa
                    if (errT.code === 'ER_ROW_IS_REFERENCED_2') {
                        return res.status(400).json({ error: "No se puede eliminar la sucursal porque pertenece al itinerario histórico de una ruta." });
                    }
                    return res.status(500).json({ error: errT.message });
                });
            }

            // Paso B: Borramos el contacto asociado para no dejar registros basura
            db.query('DELETE FROM Contacto WHERE id_contacto = ?', [id_contacto], (errC) => {
                if (errC) return db.rollback(() => res.status(500).json({ error: errC.message }));

                db.commit((errCommit) => {
                    if (errCommit) return db.rollback(() => res.status(500).json({ error: errCommit.message }));
                    
                    res.send({ message: "✅ Sucursal e información de contacto eliminadas del sistema." });
                });
            });
        });
    });
});

apiRouter.post('/cadenas', (req, res) => {
    const { nombre_cadena } = req.body;

    if (!nombre_cadena) {
        return res.status(400).json({ error: "El nombre de la cadena es obligatorio" });
    }

    const query = "INSERT INTO Cadena (nombre_cadena) VALUES (?)";

    db.query(query, [nombre_cadena], (err, result) => {
        if (err) {
            console.error("Error al insertar cadena:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.status(201).json({ 
            message: "Cadena registrada con éxito", 
            id_cadena: result.insertId 
        });
    });
});

// --- CREACIÓN Y OPTIMIZACIÓN DE RUTAS ---
const path = require('path');

apiRouter.post('/rutas/generar', (req, res) => {
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

                    const scriptPython = path.join(__dirname, '../AI-worker/VSP.py');
                    
                    console.log(`Ejecutando optimizador para Ruta #${nuevoIdRuta} en: ${scriptPython}`);

                    const comando = `PYTHONPATH=/home/fhidalgo/.local/lib/python3.12/site-packages python3 "${scriptPython}"`;

                    exec(comando, (pyErr, stdout, stderr) => {
                        if (pyErr) {
                            console.error("❌ ERROR CRÍTICO AL EJECUTAR PYTHON DESDE NODE:");
                            console.error(stderr);
                        }
                        if (stdout) {
                            console.log("🐍 MENSAJE DE PYTHON:");
                            console.log(stdout);
                        }
                    });

                    res.status(201).json({ message: `✅ Ruta #${nuevoIdRuta} creada.` });
                });
            });
        });
    });
});

// --- VISUALIZACIÓN DE RUTAS ---
apiRouter.get('/rutas/historial', (req, res) => {
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

apiRouter.delete('/rutas/:id', (req, res) => {
    const id_ruta = req.params.id;

    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('DELETE FROM Ruta_Detalle WHERE id_ruta = ?', [id_ruta], (errD) => {
            if (errD) return db.rollback(() => res.status(500).json({ error: errD.message }));

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
apiRouter.get('/operador/mi-ruta/:id_colaborador', (req, res) => {
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
apiRouter.get('/operador/paradas-completadas/:id_colaborador', (req, res) => {
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
apiRouter.post('/bitacora', (req, res) => {
    const { 
        id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, 
        folio, fecha, comentarios, id_operador, 
        perecedero, no_perecedero, bazar 
    } = req.body;

    const registros = [];

    // Mapeo exacto según el orden de columnas del INSERT:
    // [id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, perecedero, no_perecedero, bazar, peso, fecha, comentarios, id_operador]

    if (parseFloat(perecedero) > 0) {
        registros.push([
            id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, 
            parseFloat(perecedero), 0, 0, // Solo perecedero tiene valor, los demás 0
            parseFloat(perecedero),       // 'peso' total de esta fila
            fecha, comentarios, id_operador
        ]);
    }
    if (parseFloat(no_perecedero) > 0) {
        registros.push([
            id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, 
            0, parseFloat(no_perecedero), 0, // Solo no_perecedero tiene valor
            parseFloat(no_perecedero),       // 'peso' total de esta fila
            fecha, comentarios, id_operador
        ]);
    }
    if (parseFloat(bazar) > 0) {
        registros.push([
            id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, 
            0, 0, parseFloat(bazar),       // Solo bazar tiene valor
            parseFloat(bazar),             // 'peso' total de esta fila
            fecha, comentarios, id_operador
        ]);
    }

    if (registros.length === 0) {
        return res.status(400).json({ error: "Ingrese al menos un peso" });
    }

    // El query debe listar explícitamente las columnas en el orden exacto del arreglo
    const query = `
        INSERT INTO Bitacora 
        (id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, perecedero, no_perecedero, bazar, peso, fecha, comentarios, id_operador) 
        VALUES ?
    `;

    db.query(query, [registros], (err, result) => {
        if (err) {
            console.error("Error al insertar en Bitacora:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: `✅ Éxito: ${result.affectedRows} registros creados.` });
    });
});

// --- CATÁLOGOS ---
apiRouter.get('/perfiles', (req, res) => {
    db.query('SELECT * FROM Perfil', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});


// --- GPS --- //
apiRouter.post('/operador/actualizar-ubicacion', (req, res) => {
    const { id_colaborador, latitud, longitud } = req.body;

    if (!id_colaborador || !latitud || !longitud) {
        return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const query = `
        UPDATE Operador 
        SET latitud_actual = ?, longitud_actual = ?, ultima_conexion = NOW()
        WHERE id_colaborador = ?
    `;

    db.query(query, [latitud, longitud, id_colaborador], (err, result) => {
        if (err) {
            console.error("Error al actualizar GPS del operador:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Ubicación actualizada correctamente 📡" });
    });
});

apiRouter.get('/admin/ubicacion-operadores', (req, res) => {
    const query = `
        SELECT 
            o.id_operador, 
            c.nombre, 
            c.primer_apellido, 
            v.matricula, 
            o.latitud_actual, 
            o.longitud_actual, 
            o.ultima_conexion
        FROM Operador o
        JOIN Colaborador c ON o.id_colaborador = c.id_colaborador
        LEFT JOIN Vehiculo v ON o.id_vehiculo = v.id_vehiculo
        WHERE o.latitud_actual IS NOT NULL AND o.longitud_actual IS NOT NULL
    `;

    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- Desarrollo ---
// Obtener todas las tiendas de forma simple para el selector
apiRouter.get('/desarrollador/tiendas', (req, res) => {
    const query = `
        SELECT t.id_tienda, t.nombre_tienda, t.id_cadena, c.nombre_cadena 
        FROM Tienda t
        INNER JOIN Cadena c ON t.id_cadena = c.id_cadena
        ORDER BY t.nombre_tienda ASC
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// Obtener todos los operadores activos para el selector
apiRouter.get('/desarrollador/operadores', (req, res) => {
    const query = `
        SELECT o.id_operador, c.nombre, c.primer_apellido 
        FROM Operador o
        JOIN Colaborador c ON o.id_colaborador = c.id_colaborador
        ORDER BY c.nombre ASC
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- GUARDAR BITÁCORA HISTÓRICA ---
apiRouter.post('/desarrollador/bitacora-historica', (req, res) => {
    const { 
        hora_llegada, hora_salida, id_tienda, id_cadena, 
        folio, fecha, comentarios, id_operador, 
        perecedero, no_perecedero, bazar 
    } = req.body;

    // Validación estricta de datos mínimos para el histórico
    if (!fecha || !id_operador || !id_tienda) {
        return res.status(400).json({ error: "Faltan campos obligatorios (Fecha, Operador o Tienda)" });
    }

    const registros = [];

    // Mapeo de filas según las columnas de tu BD:
    // [id_ruta (NULL), hora_llegada, hora_salida, id_tienda, id_cadena, folio, perecedero, no_perecedero, bazar, peso, fecha, comentarios, id_operador]

    if (parseFloat(perecedero) > 0) {
        registros.push([
            null, hora_llegada, hora_salida, id_tienda, id_cadena, folio, 
            parseFloat(perecedero), 0, 0, 
            parseFloat(perecedero), 
            fecha, comentarios, id_operador
        ]);
    }
    if (parseFloat(no_perecedero) > 0) {
        registros.push([
            null, hora_llegada, hora_salida, id_tienda, id_cadena, folio, 
            0, parseFloat(no_perecedero), 0, 
            parseFloat(no_perecedero), 
            fecha, comentarios, id_operador
        ]);
    }
    if (parseFloat(bazar) > 0) {
        registros.push([
            null, hora_llegada, hora_salida, id_tienda, id_cadena, folio, 
            0, 0, parseFloat(bazar), 
            parseFloat(bazar), 
            fecha, comentarios, id_operador
        ]);
    }

    if (registros.length === 0) {
        return res.status(400).json({ error: "Debe ingresar al menos un peso mayor a 0 kg" });
    }

    const query = `
        INSERT INTO Bitacora 
        (id_ruta, hora_llegada, hora_salida, id_tienda, id_cadena, folio, perecedero, no_perecedero, bazar, peso, fecha, comentarios, id_operador) 
        VALUES ?
    `;

    db.query(query, [registros], (err, result) => {
        if (err) {
            console.error("❌ Error al insertar bitácora histórica:", err);
            return res.status(500).json({ error: "Error interno en la base de datos: " + err.message });
        }
        res.status(201).json({ 
            message: `✅ Éxito: Se crearon ${result.affectedRows} registros históricos correctamente.` 
        });
    });
});

// --- OBTENER TABLA DE BITÁCORAS AGRUPADA (REPORTE) ---
apiRouter.get('/global/reporte-bitacoras', (req, res) => {
    const query = `
        SELECT 
            b.folio,
            b.fecha,
            b.hora_llegada,
            b.hora_salida,
            t.nombre_tienda,
            c.nombre_cadena,
            CONCAT(col.nombre, ' ', col.primer_apellido) AS nombre_operador,
            SUM(b.perecedero) AS total_perecedero,
            SUM(b.no_perecedero) AS total_no_perecedero,
            SUM(b.bazar) AS total_bazar,
            SUM(b.peso) AS peso_total_visita,
            GROUP_CONCAT(DISTINCT b.comentarios SEPARATOR ' | ') AS comentarios_combinados
        FROM Bitacora b
        LEFT JOIN Tienda t ON b.id_tienda = t.id_tienda
        LEFT JOIN Cadena c ON b.id_cadena = c.id_cadena
        LEFT JOIN Operador o ON b.id_operador = o.id_operador
        LEFT JOIN Colaborador col ON o.id_colaborador = col.id_colaborador
        GROUP BY 
            b.folio, 
            b.fecha,
            b.hora_llegada,
            b.hora_salida,
            t.nombre_tienda,
            c.nombre_cadena,
            col.nombre,
            col.primer_apellido
        ORDER BY b.fecha DESC, b.hora_llegada DESC
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error("❌ Error al obtener reporte de bitácoras:", err);
            return res.status(500).json({ error: err.message });
        }
        res.send(result);
    });
});

// 🌟 INYECCIÓN GLOBAL DEL PREFIJO PARA EL ENTORNO DE PRODUCCIÓN/LOCAL
app.use('/api', apiRouter);

app.listen(3000, () => console.log('🚀 Servidor Cáritas Cancún en puerto 3000'));