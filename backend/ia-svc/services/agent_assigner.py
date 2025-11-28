# ia-svc/services/agent_assigner.py
import httpx
from typing import List, Dict
import os

class AgentAssigner:
    def __init__(self, usuarios_service_url: str, tickets_service_url: str):
        self.usuarios_service_url = usuarios_service_url
        self.tickets_service_url = tickets_service_url
        self.service_token = os.getenv('SERVICE_TOKEN')
        
    def _get_headers(self):
        """Headers para autenticación entre servicios"""
        return {
            'Authorization': f'Bearer {self.service_token}',
            'X-Service-Name': 'ia-svc',
            'Content-Type': 'application/json'
        }
        
    async def get_available_agents(self, empresa_id: str) -> List[Dict]:
        """Obtener agentes disponibles (rol=soporte) de una empresa"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # ✅ CORREGIDO: Endpoint correcto con filtros
                response = await client.get(
                    f"{self.usuarios_service_url}/usuarios",
                    headers=self._get_headers(),
                    params={
                        "empresaId": empresa_id,
                        "rol": "soporte",
                        "activo": "true"
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                # El endpoint puede devolver {data: [...]} o directamente [...]
                agents = data.get('data', data) if isinstance(data, dict) else data
                
                print(f"✅ Obtenidos {len(agents)} agentes para empresa {empresa_id}")
                return agents
                
            except httpx.HTTPStatusError as e:
                print(f"❌ Error HTTP al obtener agentes: {e.response.status_code} - {e.response.text}")
                raise Exception(f"Error al obtener agentes: {e}")
            except Exception as e:
                print(f"❌ Error crítico al obtener agentes: {e}")
                raise Exception(f"Error al obtener agentes: {e}")
            
    async def get_agent_workload(self, agent_id: str, empresa_id: str) -> int:
        """Obtener la carga de trabajo (tickets abiertos/en_proceso) de un agente"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # ✅ CORREGIDO: Query params correctos
                response = await client.get(
                    f"{self.tickets_service_url}/tickets",
                    headers=self._get_headers(),
                    params={
                        "empresaId": empresa_id,
                        "agenteAsignado": agent_id
                        # No enviamos estado porque queremos TODOS los tickets activos
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                tickets = data.get('data', [])
                
                # Contar solo tickets en estados activos
                active_states = ['abierto', 'en_proceso', 'en_espera']
                active_tickets = [t for t in tickets if t.get('estado') in active_states]
                
                workload = len(active_tickets)
                print(f"📊 Agente {agent_id}: {workload} tickets activos")
                return workload
                
            except Exception as e:
                print(f"⚠️ Advertencia: Error al obtener carga para agente {agent_id}: {e}. Asumiendo carga 0.")
                return 0
            
    def calculate_agent_score(self, agent: Dict, ticket: Dict) -> float:
        """
        Calcula el score:
        1. Filtra por habilidad (grupo_atencion): Si no la tiene, score = -infinito.
        2. Penaliza por carga de trabajo: Menos carga = Más score.
        """
        score = 0.0
        
        # 1. Filtro por Habilidad (Grupo de Atención)
        required_skill = ticket.get('grupo_atencion')
        if not required_skill:
            print("❌ Error: Ticket no tiene 'grupo_atencion'. No se puede asignar.")
            return -float('inf')

        # Las habilidades vienen como lista de strings
        agent_skills = set(agent.get('habilidades', []))
        
        if required_skill in agent_skills:
            # ¡El agente es compatible! Score base alto
            score = 100.0
            print(f"✅ Agente {agent.get('nombre')} tiene habilidad '{required_skill}'")
        else:
            # El agente NO tiene la habilidad. Descalificado.
            print(f"❌ Agente {agent.get('nombre')} NO tiene habilidad '{required_skill}'")
            return -float('inf')
        
        # 2. Penalización por Carga de Trabajo
        workload = agent.get('cargaActual', 0)
        
        # Penalizamos por cada ticket que ya tenga
        # Mayor workload = menor score
        score -= (workload * 10)  # Incrementado para dar más peso a la carga
        
        return score
        
    async def assign_ticket(self, ticket: Dict) -> Dict:
        """Asignar el ticket al mejor agente disponible"""
        
        empresa_id = ticket.get('empresaId')
        if not empresa_id:
            raise Exception("Ticket no tiene empresaId")
        
        # 1. Obtener agentes disponibles
        print(f"🔍 Buscando agentes para empresa {empresa_id}...")
        agents = await self.get_available_agents(empresa_id)
        
        if not agents:
            raise Exception(f"No hay agentes de 'soporte' disponibles para empresaId {empresa_id}")
        
        print(f"📋 Evaluando {len(agents)} agentes...")
            
        # 2. Obtener carga de trabajo para CADA agente
        for agent in agents:
            agent_id = agent.get('_id') or agent.get('id')
            agent['id'] = agent_id  # Normalizar
            agent['cargaActual'] = await self.get_agent_workload(agent_id, empresa_id)
            
        # 3. Calcular puntuación para cada agente
        agent_scores = []
        for agent in agents:
            score = self.calculate_agent_score(agent, ticket)
            agent_scores.append((agent, score))
            print(f"   Agent: {agent.get('nombre')} | Score: {score}")
        
        # 4. Filtrar agentes que no son compatibles (score -infinito)
        valid_agents = [item for item in agent_scores if item[1] > -float('inf')]
        
        if not valid_agents:
            # Nadie tiene la habilidad requerida
            print(f"⚠️ ADVERTENCIA: Ningún agente tiene la habilidad requerida '{ticket.get('grupo_atencion')}'")
            print("🔄 Intentando asignar a 'Mesa de Servicio' como fallback...")
            
            # Modificar ticket para buscar Mesa de Servicio
            ticket['grupo_atencion'] = 'Mesa de Servicio'
            
            # Recalcular scores con la nueva habilidad
            agent_scores_fallback = [
                (agent, self.calculate_agent_score(agent, ticket))
                for agent in agents
            ]
            valid_agents = [item for item in agent_scores_fallback if item[1] > -float('inf')]
            
            # Si ni así hay nadie...
            if not valid_agents:
                print("❌ ERROR: Tampoco hay agentes para 'Mesa de Servicio'. Asignando al primer agente disponible.")
                # Último recurso: primer agente de la lista
                best_agent = agents[0]
                print(f"⚠️ Asignación forzada a: {best_agent.get('nombre')}")
                return best_agent

        # 5. Seleccionar el agente con MEJOR puntuación
        best_agent_tuple = max(valid_agents, key=lambda x: x[1])
        best_agent = best_agent_tuple[0]
        
        print(f"✅ Ticket ID {ticket.get('id')} asignado a: {best_agent.get('nombre')} "
              f"(Carga: {best_agent.get('cargaActual')}, Score: {best_agent_tuple[1]:.2f})")
        
        return best_agent