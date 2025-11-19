# Modulos por separado/ia-svc/services/ticket_classifier.py
import os
from typing import Dict, Optional
import re

def parse_sla_to_minutes(sla_str: str) -> Optional[int]:
    """
    Convierte strings de SLA (ej. '4 horas', '20 horas', '2hrs') a minutos.
    Devuelve None si no se puede parsear.
    """
    if not sla_str or 'NA' in sla_str or 'Definición' in sla_str:
        return None
    
    # Extraer el primer número que encuentre
    match = re.search(r'(\d+)', sla_str)
    if not match:
        return None
        
    minutes = int(match.group(1))
    
    # Si solo es un número, asumimos horas, pero 'hrs' o 'hora' lo confirma
    if 'min' in sla_str.lower():
        return minutes
    elif 'hrs' in sla_str.lower() or 'hora' in sla_str.lower():
        return minutes * 60
    else:
        # Asumir horas si no se especifica (como en "4")
        return minutes * 60

"""
======================================================================
MAPA DEL CATÁLOGO DE SERVICIOS
======================================================================
Basado en tu Ctalogo de servicios.xlsx
(Este mapa DEBE ser completado con todos tus servicios)

Formato:
"Nombre del Servicio": {
    "tipo": "incidente" o "requerimiento",
    "categoria": "Categoría",
    "prioridad": "baja", "media", "alta" o "crítica",
    "sla_cliente_min": (SLA Cliente en minutos),
    "grupo_atencion": "Grupo de atención"
},
"""
SERVICE_CATALOG_BY_NAME = {
    # --- Ejemplos de tu CSV ---
    "Mapeo de carpetas compartidas": {
        "tipo": "requerimiento",
        "categoria": "Almacenamiento",
        "prioridad": "alta",
        "sla_cliente_min": parse_sla_to_minutes("4 horas"), # 240
        "grupo_atencion": "Mesa de Servicio"
    },
    "La carpeta no esta disponible": {
        "tipo": "incidente",
        "categoria": "Almacenamiento",
        "prioridad": "baja",
        "sla_cliente_min": parse_sla_to_minutes("20 horas"), # 1200
        "grupo_atencion": "Servidores/Respaldos/Storage"
    },
    "Robo de equipo cómputo": {
        "tipo": "incidente",
        "categoria": "Computo Personal",
        "prioridad": "media",
        "sla_cliente_min": parse_sla_to_minutes("32 horas"), # 1920
        "grupo_atencion": "Mesa de Servicio"
    },
    "Desbloqueo de cuenta": {
        "tipo": "requerimiento",
        "categoria": "Directorio Activo",
        "prioridad": "alta",
        "sla_cliente_min": parse_sla_to_minutes("2 horas"), # 120
        "grupo_atencion": "Mesa de Servicio"
    },
    "Sin salida a Internet": {
        "tipo": "incidente",
        "categoria": "Redes",
        "prioridad": "media",
        "sla_cliente_min": parse_sla_to_minutes("12 horas"), # 720
        "grupo_atencion": "Telecomunicaciones"
    },
    "Virus": {
        "tipo": "incidente",
        "categoria": "Seguridad",
        "prioridad": "alta",
        "sla_cliente_min": parse_sla_to_minutes("4 horas"), # 240
        "grupo_atencion": "Seguridad"
    }
    # ... !!!
    # ... !!! IMPORTANTE: AGREGA EL RESTO DE TUS SERVICIOS DEL CSV AQUÍ !!!
    # ... !!!
}

# Clasificación por defecto si 'servicioNombre' no se encuentra
DEFAULT_CLASSIFICATION = {
    "tipo": "incidente",
    "categoria": "General",
    "prioridad": "media",
    "sla_cliente_min": parse_sla_to_minutes("24 horas"), # 1440
    "grupo_atencion": "Mesa de Servicio" # Grupo de atención por defecto
}

class TicketClassifier:
    def __init__(self):
        # El vectorizador y el modelo ya no son necesarios para esta lógica
        print("Clasificador de tickets basado en Catálogo de Servicios INICIADO.")
            
    def classify_ticket(self, ticket_data: Dict) -> Dict[str, str]:
        """
        Clasifica el ticket consultando el 'servicioNombre' en el catálogo.
        'ticket_data' es el diccionario recibido de RabbitMQ.
        """
        service_name = ticket_data.get('servicioNombre')
        
        classification_data = DEFAULT_CLASSIFICATION.copy()

        if service_name and service_name in SERVICE_CATALOG_BY_NAME:
            # ¡Éxito! Encontramos el servicio en el catálogo.
            print(f"Ticket clasificado por catálogo: {service_name}")
            classification_data = SERVICE_CATALOG_BY_NAME[service_name].copy()
        
        else:
            # Fallback: El servicio no vino o no está en el mapa.
            print(f"Advertencia: Servicio '{service_name}' no encontrado. Usando default.")

        # Reformatear para el 'ia-svc/main.py' y el Ticket.model.js
        # Tu CSV usa "SLA Cliente" para el tiempo de resolución.
        # Asumimos que tiempoRespuesta y tiempoResolucion son el mismo por ahora
        sla_min = classification_data.get('sla_cliente_min')
        
        return {
            'tipo': classification_data.get('tipo'),
            'prioridad': classification_data.get('prioridad'),
            'categoria': classification_data.get('categoria'),
            'grupo_atencion': classification_data.get('grupo_atencion'),
            
            # Estos son los campos que tu Ticket.model.js espera
            'tiempoResolucion': sla_min,
            'tiempoRespuesta': sla_min # Ajusta si tienes otro campo para SLA de respuesta
        }