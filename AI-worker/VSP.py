import mysql.connector
import openrouteservice
from openrouteservice import exceptions
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
import numpy as np
import sys
from dotenv import load_dotenv
import os

# ===============================
# 1. CONFIGURACIÓN
# ===============================

# Configuración de ORS con Timeout y reintentos automáticos
ORS_CLIENT = openrouteservice.Client(
    key="eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkMzRhMTZhOTczNjQ3NDViNTdmN2IzYjY1NDlhODlhIiwiaCI6Im11cm11cjY0In0=",
    timeout=60, 
    retry_over_query_limit=True
)

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'SICA_BD'), 
        port=int(os.getenv('DB_PORT', 3306))    
    )

# CEDIS FIJO (ID 0 para la matriz de caché)
CEDIS = {"id_tienda": 0, "nombre": "CEDIS Rancho Viejo", "lng": -86.842340, "lat": 21.213016}

# ===============================
# 2. LÓGICA DE OPTIMIZACIÓN
# ===============================

def optimizar_rutas_pendientes():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # 1. Buscar rutas que no han sido procesadas
    cursor.execute("SELECT id_ruta FROM Ruta WHERE optimizada = 0")
    rutas_pendientes = cursor.fetchall()

    if not rutas_pendientes:
        print("No hay rutas pendientes de optimización.")
        return

    for ruta in rutas_pendientes:
        id_ruta = ruta['id_ruta']
        print(f"\n--- Iniciando optimización de Ruta #{id_ruta} ---")

        # 2. Obtener las tiendas de la ruta
        query_tiendas = """
            SELECT rd.id_ruta_detalle, t.id_tienda, t.longitud, t.latitud 
            FROM Ruta_Detalle rd
            JOIN Tienda t ON rd.id_tienda = t.id_tienda
            WHERE rd.id_ruta = %s
        """
        cursor.execute(query_tiendas, (id_ruta,))
        puntos_db = cursor.fetchall()

        if not puntos_db:
            print(f"Ruta #{id_ruta} vacía. Saltando...")
            continue

        # Estructura de nodos: [0: CEDIS, 1: TiendaA, 2: TiendaB...]
        nodos = [CEDIS] + [
            {
                "id_tienda": p['id_tienda'], 
                "lng": float(p['longitud']), 
                "lat": float(p['latitud']), 
                "id_rd": p['id_ruta_detalle']
            } for p in puntos_db
        ]
        
        n = len(nodos)
        time_matrix = np.zeros((n, n))
        dist_matrix = np.zeros((n, n))
        faltan_datos_cache = False

        # 3. Intentar llenar la matriz desde la BASE DE DATOS (Caché)
        print(f"Verificando caché local para {n} puntos...")
        for i in range(n):
            for j in range(n):
                if i == j: continue
                
                id_a = nodos[i]['id_tienda']
                id_b = nodos[j]['id_tienda']

                cursor.execute(
                    "SELECT duracion_segundos FROM matriz_cache WHERE id_origen = %s AND id_destino = %s", 
                    (id_a, id_b)
                )
                cache_hit = cursor.fetchone()

                if cache_hit:
                    time_matrix[i][j] = cache_hit['duracion_segundos']
                else:
                    faltan_datos_cache = True

        # 4. Si falta información, llamamos a la API de Matrix (Una sola petición)
        if faltan_datos_cache:
            try:
                print("Faltan datos en caché. Solicitando matriz completa a ORS...")
                coords = [[t["lng"], t["lat"]] for t in nodos]
                
                # Pedimos la matriz de duración a la API
                matrix_res = ORS_CLIENT.distance_matrix(
                    locations=coords,
                    profile='driving-car',
                    metrics=['duration', 'distance']
                )
                
                durations = matrix_res['durations']
                distances = matrix_res['distances']

                # Guardamos TODOS los datos nuevos en la BD de un solo golpe
                for i in range(n):
                    for j in range(n):
                        if i == j: continue
                        duracion = durations[i][j]
                        distancia = distances[i][j]
                        
                        if duracion is not None:
                            time_matrix[i][j] = duracion
                            dist_matrix[i][j] = distancia
                            # Insertamos en caché (IGNORE para evitar errores si ya existía el par)
                            cursor.execute("""
                                INSERT IGNORE INTO matriz_cache (id_origen, id_destino, duracion_segundos, distancia_metros) 
                                VALUES (%s, %s, %s, %s)
                            """, (nodos[i]['id_tienda'], nodos[j]['id_tienda'], int(duracion), int(distancia)))
                
                db.commit()
                print("Caché actualizado con éxito.")

            except Exception as e:
                print(f"Error crítico consultando la API: {e}")
                # Si no hay datos suficientes para armar la ruta, saltamos
                if not np.any(time_matrix): continue 

        # 5. Configurar OR-TOOLS (TSP)
        manager = pywrapcp.RoutingIndexManager(n, 1, 0)
        routing = pywrapcp.RoutingModel(manager)

        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(time_matrix[from_node][to_node])

        transit_callback_index = routing.RegisterTransitCallback(time_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )

        # 6. Resolver
        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            print(f"Solución encontrada para Ruta #{id_ruta}.")
            index = routing.Start(0)
            orden_secuencia = 1
            
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                if node_index != 0:
                    id_rd = nodos[node_index]['id_rd']
                    cursor.execute(
                        "UPDATE Ruta_Detalle SET orden = %s WHERE id_ruta_detalle = %s", 
                        (orden_secuencia, id_rd)
                    )
                    orden_secuencia += 1
                index = solution.Value(routing.NextVar(index))

            cursor.execute("UPDATE Ruta SET optimizada = 1 WHERE id_ruta = %s", (id_ruta,))
            db.commit()
            print(f"Ruta #{id_ruta} guardada con éxito.")
        else:
            print(f"No se pudo encontrar una ruta óptima para #{id_ruta}.")

    cursor.close()
    db.close()

if __name__ == "__main__":
    try:
        optimizar_rutas_pendientes()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        sys.exit(1)