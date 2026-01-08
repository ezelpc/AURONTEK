# ia-svc/main.py
from fastapi import FastAPI, HTTPException
import uvicorn
import os
from dotenv import load_dotenv
from pathlib import Path
import httpx
from datetime import datetime
import threading

from services.ticket_classifier import TicketClassifier
from services.agent_assigner import AgentAssigner
from services.rabbitmq_client import RabbitMQClient

# ✅ Cargar variables de entorno solo en desarrollo
ENV = os.getenv('NODE_ENV', 'development')

if ENV == 'development':
    local_env_path = Path(__file__).parent / '.env'
    load_dotenv(dotenv_path=local_env_path)
    print(f'[{ENV}] 📄 Cargando variables desde .env local')

print(f'[{ENV}] 🌍 Entorno detectado')

# Inicializar logger lo antes posible
try:
    from .logger import init_logger
except Exception:
    # fallback relative import for when module executed as script
    try:
        from logger import init_logger
    except Exception:
        init_logger = None

if init_logger:
    init_logger()

# Configuración de la aplicación
app = FastAPI(
    title="Servicio de IA para Help Desk",
    description="Servicio de procesamiento inteligente de tickets",
    version="1.0.0"
)

# CORS manejado por el Gateway, no agregar aquí

# Middleware de Seguridad (Service Token)
@app.middleware("http")
async def verify_service_token(request, call_next):
    # Skip helatcheck and root
    if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
        return await call_next(request)

    # Check Headers
    auth_header = request.headers.get('Authorization')
    service_header = request.headers.get('X-Service-Token')
    
    expected_token = os.getenv('SERVICE_TOKEN')
    
    if not expected_token:
        # Si no hay token configurado, dejar pasar (Modo inseguro/Dev)
        # print("⚠️ SERVICE_TOKEN no configurado en IA-SVC")
        return await call_next(request)
        
    token_received = None
    if auth_header and auth_header.startswith('Bearer '):
        token_received = auth_header.split(' ')[1]
    elif service_header:
        token_received = service_header
        
    if token_received != expected_token:
        # return JSONResponse(status_code=401, content={"detail": "Unauthorized Service Call"})
        # FastAPI middleware needs Response object
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=401, content={"detail": "Unauthorized Service Call"})

    return await call_next(request)

# Configuración de servicios
if os.getenv('DOCKER_ENV') == 'true':
    RABBITMQ_URL = os.getenv('RABBITMQ_URL')
else:
    RABBITMQ_URL = os.getenv('RABBITMQ_URL')

USUARIOS_SERVICE_URL = os.getenv('USUARIOS_SERVICE_URL', 'http://localhost:3001')
TICKETS_SERVICE_URL = os.getenv('TICKETS_SERVICE_URL', 'http://localhost:3002')
SERVICE_TOKEN = os.getenv('SERVICE_TOKEN','23022e6bdb08ad3631c48af69253c5528f42cbed36b024b2fc041c0cfb23723b')

# Inicializar servicios
ticket_classifier = TicketClassifier()
agent_assigner = AgentAssigner(USUARIOS_SERVICE_URL, TICKETS_SERVICE_URL)
rabbitmq_client = RabbitMQClient(RABBITMQ_URL)

async def update_ticket_classification(ticket_id: str, classification: dict):
    """Actualizar la clasificación del ticket en tickets-svc"""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.patch(
                f"{TICKETS_SERVICE_URL}/tickets/{ticket_id}/clasificacion",
                headers={
                    'Authorization': f'Bearer {SERVICE_TOKEN}',
                    'X-Service-Name': 'ia-svc',
                    'Content-Type': 'application/json'
                },
                json=classification
            )
            response.raise_for_status()
            print(f"✅ Ticket {ticket_id} clasificado correctamente")
            return response.json()
        except Exception as e:
            print(f"❌ Error actualizando clasificación del ticket {ticket_id}: {e}")
            raise

async def assign_ticket_to_agent(ticket_id: str, agent_id: str):
    """Asignar el ticket a un agente en tickets-svc"""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.put(
                f"{TICKETS_SERVICE_URL}/tickets/{ticket_id}/asignar-ia",
                headers={
                    'Authorization': f'Bearer {SERVICE_TOKEN}',
                    'X-Service-Name': 'ia-svc',
                    'Content-Type': 'application/json'
                },
                json={'agenteId': agent_id}
            )
            response.raise_for_status()
            print(f"✅ Ticket {ticket_id} asignado a agente {agent_id}")
            return response.json()
        except Exception as e:
            print(f"❌ Error asignando ticket {ticket_id} a agente: {e}")
            raise

async def process_new_ticket(message: dict):
    """Procesar un nuevo ticket"""
    try:
        print("\n" + "="*60)
        print("🎫 NUEVO TICKET RECIBIDO")
        print("="*60)
        
        # 1. Extraer datos del ticket
        ticket_data = message.get('ticket', {})
        ticket_id = ticket_data.get('id')
        
        if not ticket_id:
            print("❌ Error: Mensaje sin ID de ticket")
            return
        
        print(f"📋 Ticket ID: {ticket_id}")
        print(f"📝 Título: {ticket_data.get('titulo', 'N/A')}")
        print(f"🏢 Empresa ID: {ticket_data.get('empresaId', 'N/A')}")
        print(f"🔧 Servicio: {ticket_data.get('servicioNombre', 'N/A')}")
        
        # 2. Clasificar ticket
        print("\n🔍 CLASIFICANDO TICKET...")
        classification = ticket_classifier.classify_ticket(ticket_data)
        
        print(f"   Tipo: {classification.get('tipo')}")
        print(f"   Prioridad: {classification.get('prioridad')}")
        print(f"   Categoría: {classification.get('categoria')}")
        print(f"   Grupo de Atención: {classification.get('grupo_atencion')}")
        print(f"   SLA Resolución: {classification.get('tiempoResolucion')} min")
        
        # 3. Actualizar ticket con clasificación
        try:
            await update_ticket_classification(ticket_id, classification)
        except Exception as e:
            print(f"⚠️ No se pudo actualizar clasificación, continuando con asignación...")
        
        # 4. Actualizar ticket_data para asignación
        ticket_data.update(classification)
        
        # 5. Asignar agente
        print("\n👥 ASIGNANDO AGENTE...")
        best_agent = await agent_assigner.assign_ticket(ticket_data)
        
        agent_id = best_agent.get('_id') or best_agent.get('id')
        agent_name = best_agent.get('nombre', 'Desconocido')
        
        # 6. Actualizar ticket con asignación
        try:
            await assign_ticket_to_agent(ticket_id, agent_id)
        except Exception as e:
            print(f"⚠️ No se pudo asignar automáticamente, publicando evento...")
            # Si falla la asignación directa, publicar evento para que admin lo asigne
            rabbitmq_client.publish(
                'ticket.sugerencia_asignacion',
                {
                    'ticketId': ticket_id,
                    'agenteIdSugerido': agent_id,
                    'agenteNombre': agent_name,
                    'clasificacion': classification
                }
            )
            return
        
        # 7. Publicar evento de éxito
        rabbitmq_client.publish(
            'ticket.procesado',
            {
                'ticketId': ticket_id,
                'agenteId': agent_id,
                'agenteNombre': agent_name,
                'clasificacion': classification,
                'timestamp': datetime.now().isoformat()
            }
        )
        
        print("\n" + "="*60)
        print(f"✅ TICKET {ticket_id} PROCESADO EXITOSAMENTE")
        print(f"👤 Asignado a: {agent_name}")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR PROCESANDO TICKET: {e}")
        print("="*60 + "\n")
        
        # Publicar evento de error
        try:
            rabbitmq_client.publish(
                'ticket.error',
                {
                    'ticketId': ticket_data.get('id'),
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }
            )
        except:
            pass

@app.on_event("startup")
async def startup_event():
    """Inicializar conexiones y configuraciones al arrancar"""
    print("\n" + "="*60)
    print("🚀 INICIANDO SERVICIO DE IA")
    print("="*60)
    print(f"📡 RabbitMQ URL: {RABBITMQ_URL}")
    print(f"👥 Usuarios Service: {USUARIOS_SERVICE_URL}")
    print(f"🎫 Tickets Service: {TICKETS_SERVICE_URL}")
    print(f"🔑 Service Token: {'Configurado' if SERVICE_TOKEN else '❌ NO CONFIGURADO'}")
    print("="*60 + "\n")
    
    def start_consumer():
        try:
            rabbitmq_client.start_consuming(
                queue_name='ia_tickets',
                routing_key='ticket.creado',
                callback=process_new_ticket
            )
        except Exception as e:
            print(f"❌ Error en consumidor RabbitMQ: {e}")
    
    # Iniciar consumidor en un hilo separado
    consumer_thread = threading.Thread(target=start_consumer, daemon=True)
    consumer_thread.start()
    print("✅ Consumidor RabbitMQ iniciado\n")

@app.on_event("shutdown")
async def shutdown_event():
    """Limpiar recursos al cerrar"""
    print("\n🛑 Cerrando servicio de IA...")
    rabbitmq_client.close()
    print("✅ Conexiones cerradas\n")

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "service": "IA Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud del servicio"""
    rabbitmq_status = "connected" if rabbitmq_client.connection and not rabbitmq_client.connection.is_closed else "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "classifier": "ready",
            "assigner": "ready",
            "rabbitmq": rabbitmq_status
        },
        "config": {
            "rabbitmq_url": RABBITMQ_URL,
            "usuarios_svc": USUARIOS_SERVICE_URL,
            "tickets_svc": TICKETS_SERVICE_URL
        }
    }

@app.post("/classify")
async def classify_ticket_endpoint(ticket_data: dict):
    """Endpoint manual para clasificar un ticket"""
    try:
        classification = ticket_classifier.classify_ticket(ticket_data)
        return {
            "success": True,
            "classification": classification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assign")
async def assign_ticket_endpoint(ticket_data: dict):
    """Endpoint manual para asignar un ticket"""
    try:
        best_agent = await agent_assigner.assign_ticket(ticket_data)
        return {
            "success": True,
            "agent": {
                "id": best_agent.get('_id') or best_agent.get('id'),
                "nombre": best_agent.get('nombre'),
                "cargaActual": best_agent.get('cargaActual')
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=int(os.getenv('IA_PORT', 3005)), 
        reload=True
    )