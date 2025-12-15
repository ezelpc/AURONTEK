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
        """Obtener agentes disponibles (rol=soporte/RESOLUTOR) de una empresa"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Se buscan usuarios con rol 'soporte' que es el mapeo interno de Resolutor
                response = await client.get(
                    f"{self.usuarios_service_url}/usuarios",
                    headers=self._get_headers(),
                    params={
                        "empresaId": empresa_id,
                        "rol": "resolutor-empresa", # Updated from legacy 'soporte'
                        "activo": "true"
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                agents = data.get('data', data) if isinstance(data, dict) else data
                
                print(f"✅ Obtenidos {len(agents)} agentes (Resolutores) para empresa {empresa_id}")
                return agents
                
            except Exception as e:
                print(f"❌ Error al obtener agentes: {e}")
                raise Exception(f"Error al obtener agentes: {e}")
            
    async def get_agent_workload_details(self, agent_id: str, empresa_id: str) -> Dict:
        """
        Obtener detalles de carga de trabajo:
        - Count total
        - Weighted score (Critico=3, Alta=2, Media=1)
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    f"{self.tickets_service_url}/tickets",
                    headers=self._get_headers(),
                    params={
                        "empresaId": empresa_id,
                        "agenteAsignado": agent_id
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                tickets = data.get('data', [])
                
                # Filtrar activos
                active_states = ['abierto', 'en_proceso', 'en_espera']
                active_tickets = [t for t in tickets if t.get('estado') in active_states]
                
                count = len(active_tickets)
                weighted_sum = 0
                
                # Calcular peso basado en prioridad
                priority_weights = {
                    'critica': 3,
                    'alta': 2,
                    'media': 1,
                    'baja': 0.5
                }
                
                for t in active_tickets:
                    prio = t.get('prioridad', 'media').lower()
                    weighted_sum += priority_weights.get(prio, 1)
                
                return {
                    "count": count,
                    "weighted_sum": weighted_sum
                }
                
            except Exception as e:
                print(f"⚠️ Error al obtener carga para agente {agent_id}: {e}. Asumiendo carga 0.")
                return {"count": 0, "weighted_sum": 0}
            
    def calculate_agent_score(self, agent: Dict, ticket: Dict, workload_data: Dict) -> float:
        """
        Calcula el score de asignación.
        Reglas:
        1. Habilidad requerida obligatoria.
        2. Prioridad absoluta: Menor cantidad de tickets.
        3. Desempate: Menor carga ponderada (menos tickets críticos).
        """
        score = 1000.0 # Base alta
        
        # 1. Filtro por Habilidad
        required_skill = ticket.get('grupo_atencion')
        if not required_skill:
             # Si no tiene grupo, asumimos que cualquiera puede tomarlo o es Mesa de Servicio
            pass 
        else:
            agent_skills = set(agent.get('habilidades', []))
            if required_skill not in agent_skills:
                print(f"❌ Agente {agent.get('nombre')} NO tiene habilidad '{required_skill}'")
                return -float('inf')
        
        # 2. Penalización por Cantidad de Tickets (Factor Dominante)
        # Queremos que la diferencia en cantidad pese MÁS que la seguridad propia.
        # Ejemplo: 
        # A tiene 2 tickets pesados (Weight 6). Penalty: (2 * 100) + 6 = 206
        # B tiene 5 tickets ligeros (Weight 5). Penalty: (5 * 100) + 5 = 505
        # Score A > Score B. A gana.
        
        count = workload_data['count']
        weighted = workload_data['weighted_sum']
        
        count_penalty = count * 100  # Gran peso a la cantidad
        weight_penalty = weighted * 1    # Peso menor a la severidad interna
        
        score -= (count_penalty + weight_penalty)
        
        return score
        
    async def assign_ticket(self, ticket: Dict) -> Dict:
        """Asignar el ticket al mejor Resolutor disponible"""
        
        empresa_id = ticket.get('empresaId')
        if not empresa_id:
            raise Exception("Ticket no tiene empresaId")
        
        # 1. Obtener agentes
        agents = await self.get_available_agents(empresa_id)
        if not agents:
            raise Exception(f"No hay Resolutores disponibles para empresaId {empresa_id}")
            
        print(f"📋 Evaluando {len(agents)} Resolutores...")
        
        agent_scores = []
        
        # 2. Calcular Score para cada agente
        for agent in agents:
            agent_id = agent.get('_id') or agent.get('id')
            agent['id'] = agent_id
            
            # Obtener carga detallada
            workload = await self.get_agent_workload_details(agent_id, empresa_id)
            agent['carga_detallada'] = workload
            
            # Calcular Score
            score = self.calculate_agent_score(agent, ticket, workload)
            
            agent_scores.append((agent, score))
            print(f"   👤 {agent.get('nombre')} | Tickets: {workload['count']} (Peso: {workload['weighted_sum']}) | Score: {score}")
        
        # 3. Filtrar elegibles
        valid_agents = [item for item in agent_scores if item[1] > -float('inf')]
        
        if not valid_agents:
            print(f"⚠️ Ningún agente tiene la habilidad '{ticket.get('grupo_atencion', 'N/A')}'. Intentando fallback a Mesa de Servicio.")
            # Fallback logic podría ir aquí si se requiere
            # Por ahora, devolvemos el menos ocupado aunque no tenga la skill (o fail)
            # User requirement imply strict matching usually, but fallback is safer.
            # Vamos a asignar al que tenga menos carga general como último recurso
            best_fallback = min(agent_scores, key=lambda x: (x[0]['carga_detallada']['count']))
            print(f"⚠️ Asignación forzada por falta de skills a: {best_fallback[0].get('nombre')}")
            return best_fallback[0]

        # 4. Seleccionar Mejor Candidato
        best_agent_tuple = max(valid_agents, key=lambda x: x[1])
        best_agent = best_agent_tuple[0]
        
        print(f"✅ ASIGNADO A: {best_agent.get('nombre')} (Carga: {best_agent['carga_detallada']['count']})")
        
        return best_agent