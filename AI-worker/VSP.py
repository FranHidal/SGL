import mysql.connector
import openrouteservice
from openrouteservice import exceptions # Importamos excepciones de ORS
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
import numpy as np
import time

# ===============================
# 1. CONFIGURACIÓN Y CONEXIÓN
# ===============================

# Implementamos el timeout de 60 segundos y activamos reintentos automáticos 
# en caso de superar el límite de velocidad de la API (Rate Limit).
ORS_CLIENT = openrouteservice.Client(
    key="eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkMzRhMTZhOTczNjQ3NDViNTdmN2IzYjY1NDlhODlhIiwiaCI6Im11cm11cjY0In0=",
    timeout=60, 
    retry_over_query_limit=True
)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="sgl_bd"
    )

# CEDIS FIJO (Punto de partida en Rancho Viejo)
CEDIS = {"id": 0, "nombre": "CEDIS Rancho Viejo", "lng": -86.842340, "lat": 21.213016}

# ===============================
# 2. LÓGICA DE OPTIMIZACIÓN
# ===============================
def optimizar_rutas_pendientes():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Buscar rutas que el gerente creó pero Python no ha ordenado
    cursor.execute("SELECT id_ruta, id_operador FROM Ruta WHERE optimizada = 0")
    rutas_pendientes = cursor.fetchall()

    for ruta in rutas_pendientes:
        id_ruta = ruta['id_ruta']
        print(f"\n--- Optimizando Ruta #{id_ruta} ---")

        # Traer las tiendas de esta ruta específica
        query_tiendas = """
            SELECT rd.id_ruta_detalle, t.nombre_tienda, t.longitud, t.latitud 
            FROM Ruta_Detalle rd
            JOIN Tienda t ON rd.id_tienda = t.id_tienda
            WHERE rd.id_ruta = %s
        """
        cursor.execute(query_tiendas, (id_ruta,))
        puntos_ruta = cursor.fetchall()

        if not puntos_ruta: 
            print(f"Ruta #{id_ruta} no tiene tiendas asignadas.")
            continue

        # Construir lista de coordenadas: [CEDIS, Tienda 1, Tienda 2...]
        tiendas_data = [CEDIS] + [
            {"id_rd": p['id_ruta_detalle'], "nombre": p['nombre_tienda'], "lng": float(p['longitud']), "lat": float(p['latitud'])} 
            for p in puntos_ruta
        ]
        
        coords = [[t["lng"], t["lat"]] for t in tiendas_data]
        
        # ==========================================
        # LLAMADA A LA API CON MANEJO DE ERRORES
        # ==========================================
        try:
            print(f"Solicitando matriz de tiempos para {len(coords)} puntos...")
            matrix = ORS_CLIENT.distance_matrix(
                locations=coords, 
                profile='driving-car', 
                metrics=['duration']
            )
            time_matrix = matrix['durations']
        except exceptions.Timeout:
            print(f"ERROR: Tiempo de espera agotado en Ruta #{id_ruta}. Saltando...")
            continue
        except exceptions.ApiError as e:
            print(f"ERROR DE API en Ruta #{id_ruta}: {e}")
            continue
        except Exception as e:
            print(f"ERROR INESPERADO: {e}")
            continue

        # --- CONFIGURAR OR-TOOLS ---
        n = len(coords)
        manager = pywrapcp.RoutingIndexManager(n, 1, 0) # 1 vehículo por ruta
        routing = pywrapcp.RoutingModel(manager)

        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            # Manejamos posibles valores nulos de la API
            val = time_matrix[from_node][to_node]
            return int(val) if val is not None else 999999

        transit_callback_index = routing.RegisterTransitCallback(time_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC

        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            # Extraer el orden óptimo
            index = routing.Start(0)
            orden_contador = 1
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                if node != 0: # Saltamos el CEDIS (index 0) para actualizar tiendas
                    id_rd = tiendas_data[node]['id_rd']
                    cursor.execute("UPDATE Ruta_Detalle SET orden = %s WHERE id_ruta_detalle = %s", (orden_contador, id_rd))
                    orden_contador += 1
                index = solution.Value(routing.NextVar(index))
            
            # Marcar ruta como optimizada
            cursor.execute("UPDATE Ruta SET optimizada = 1 WHERE id_ruta = %s", (id_ruta,))
            db.commit()
            print(f"ÉXITO: Ruta #{id_ruta} optimizada y guardada.")
        else:
            print(f"No se encontró solución para Ruta #{id_ruta}.")

    cursor.close()
    db.close()

if __name__ == "__main__":
    optimizar_rutas_pendientes()