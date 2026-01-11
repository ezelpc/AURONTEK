# ia-svc/services/agent_assigner.py
import httpx
from typing import List, Dict
from datetime import datetime, timedelta
import os

class AgentAssigner:
    def __init__(self, usuarios_service_url: str, tickets_service_url: str):
        self.usuarios_service_url = usuarios_service_url
        self.tickets_service_url = tickets_service_url
        self.service_token = os.getenv('SERVICE_TOKEN', '23022e6bdb08ad3631c48af69253c5528f42cbed36b024b2fc041c0cfb23723b')
        
    def _get_headers(self):
        """Headers para autenticación entre servicios"""
        return {
            'Authorization': f'Bearer {self.service_token}',
            'X-Service-Name': 'ia-svc',
            'Content-Type': 'application/json'
        }
        
    async def get_available_agents(self, grupo_atencion: str, empresa_id: str) -> List[Dict]:
        """
        Obtener agentes disponibles del grupo de atención específico
        
        Args:
            grupo_atencion: Grupo técnico (ej: "Mesa de Servicio")
            empresa_id: ID de la empresa
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Buscar usuarios activos de la empresa (sin filtrar por rol aquí)
                response = await client.get(
                    f"{self.usuarios_service_url}/usuarios",
                    headers=self._get_headers(),
                    params={
                        "empresaId": empresa_id,
                        "activo": "true"
                    }
                )
                
                data = response.json()
                # Manejar diferentes formatos de respuesta: {data: [...]}, {usuarios: [...]}, o [...]
                if isinstance(data, dict):
                    all_agents = data.get('data') or data.get('usuarios') or data
                    # Si sigue siendo un dict (y no una lista dentro), es probable que sea el error
                    if isinstance(all_agents, dict):
                        print(f"⚠️ Formato de respuesta inesperado de usuarios-svc: {all_agents.keys()}")
                        all_agents = []
                else:
                    all_agents = data
                
                # Roles válidos para asignación de tickets
                valid_roles = ['soporte', 'Soporte', 'resolutor-empresa', 'beca-soporte', 'admin-interno']
                
                # Filtrar por rol válido Y grupo de atención
                filtered_agents = [
                    agent for agent in all_agents
                    if agent.get('rol') in valid_roles and 
                       grupo_atencion in agent.get('gruposDeAtencion', [])
                ]
                
                print(f"✅ Obtenidos {len(filtered_agents)}/{len(all_agents)} agentes del grupo '{grupo_atencion}' para empresa {empresa_id}")
                return filtered_agents
                
            except Exception as e:
                print(f"❌ Error al obtener agentes: {e}")
                raise Exception(f"Error al obtener agentes: {e}")
            
    async def get_agent_tickets(self, agent_id: str, empresa_id: str, states: List[str] = None) -> List[Dict]:
        """
        Obtener tickets de un agente
        
        Args:
            agent_id: ID del agente
            empresa_id: ID de la empresa
            states: Lista de estados a filtrar (default: activos)
        """
        if states is None:
            states = ['abierto', 'en_proceso', 'en_espera']
            
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Obtener TODOS los tickets de la empresa con límite alto
                # El endpoint normal filtra por rol, necesitamos usar el service token
                response = await client.get(
                    f"{self.tickets_service_url}/tickets",
                    headers=self._get_headers(),
                    params={
                        "empresaId": empresa_id,
                        "limite": "1000"  # Límite alto para obtener todos
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                all_tickets = data.get('data', [])
                
                # Filtrar por agente asignado Y estados localmente
                filtered_tickets = [
                    t for t in all_tickets
                    if (t.get('agenteAsignado') == agent_id or 
                        (isinstance(t.get('agenteAsignado'), dict) and 
                         t.get('agenteAsignado', {}).get('_id') == agent_id))
                    and t.get('estado') in states
                ]
                
                print(f"   [DEBUG] Agente {agent_id}: {len(filtered_tickets)} tickets activos de {len(all_tickets)} totales")
                
                return filtered_tickets
                
            except Exception as e:
                print(f"⚠️ Error al obtener tickets para agente {agent_id}: {e}")
                return []
    
    def calculate_ticket_age_days(self, ticket: Dict) -> float:
        """Calcula la edad del ticket en días desde su asignación"""
        fecha_asignacion = ticket.get('fechaAsignacion')
        if not fecha_asignacion:
            # Fallback a createdAt si no hay fechaAsignacion
            fecha_asignacion = ticket.get('createdAt')
        
        if not fecha_asignacion:
            return 0.0
        
        try:
            # Parsear fecha (puede venir como string ISO o Date)
            if isinstance(fecha_asignacion, str):
                fecha = datetime.fromisoformat(fecha_asignacion.replace('Z', '+00:00'))
            else:
                fecha = fecha_asignacion
            
            delta = datetime.now() - fecha.replace(tzinfo=None)
            return delta.total_seconds() / 86400  # Convertir a días
        except:
            return 0.0
    
    def is_ticket_stagnant(self, ticket: Dict, hours_threshold: int = 48) -> bool:
        """
        Determina si un ticket está estancado (sin actualización en X horas)
        
        Args:
            ticket: Diccionario del ticket
            hours_threshold: Horas sin actualización para considerar estancado
        """
        updated_at = ticket.get('updatedAt')
        if not updated_at:
            return False
        
        try:
            if isinstance(updated_at, str):
                fecha = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            else:
                fecha = updated_at
            
            delta = datetime.now() - fecha.replace(tzinfo=None)
            hours_since_update = delta.total_seconds() / 3600
            
            return hours_since_update > hours_threshold
        except:
            return False
            
    async def calculate_agent_metrics(self, agent_id: str, empresa_id: str) -> Dict:
        """
        Calcula métricas completas del agente incluyendo anti-gaming
        
        Returns:
            {
                "active_count": int,
                "active_weighted": float,
                "avg_ticket_age_days": float,
                "stagnant_count": int,
                "resolution_velocity": float,
                "efficiency_ratio": float,
                "gaming_penalty": float
            }
        """
        # Obtener tickets activos
        active_tickets = await self.get_tickets_for_agent(agent_id, empresa_id)
        
        # Obtener tickets históricos (últimos 30 días para eficiencia)
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        # Obtener todos los tickets del agente (activos + cerrados recientes)
        all_states = ['abierto', 'en_proceso', 'en_espera', 'resuelto', 'cerrado']
        all_tickets = await self.get_tickets_for_agent(agent_id, empresa_id, all_states)
        
        # Filtrar tickets de últimos 30 días
        recent_tickets = [
            t for t in all_tickets
            if self._is_ticket_recent(t, thirty_days_ago)
        ]
        
        # Calcular métricas básicas
        active_count = len(active_tickets)
        
        # Peso ponderado por prioridad
        priority_weights = {
            'critica': 3,
            'crítica': 3,
            'alta': 2,
            'media': 1,
            'baja': 0.5
        }
        
        active_weighted = sum(
            priority_weights.get(t.get('prioridad', 'media').lower(), 1)
            for t in active_tickets
        )
        
        # Calcular edad promedio de tickets activos
        if active_tickets:
            ages = [self.calculate_ticket_age_days(t) for t in active_tickets]
            avg_ticket_age_days = sum(ages) / len(ages)
        else:
            avg_ticket_age_days = 0.0
        
        # Contar tickets estancados
        stagnant_count = sum(
            1 for t in active_tickets
            if self.is_ticket_stagnant(t, hours_threshold=48)
        )
        
        # Calcular velocidad de resolución (tickets cerrados últimos 7 días)
        closed_last_7_days = [
            t for t in recent_tickets
            if t.get('estado') in ['resuelto', 'cerrado']
            and self._is_ticket_recent(t, seven_days_ago)
        ]
        resolution_velocity = len(closed_last_7_days) / 7.0
        
        # Calcular eficiencia (ratio de tickets cerrados vs asignados en 30 días)
        assigned_last_30 = len(recent_tickets)
        closed_last_30 = len([
            t for t in recent_tickets
            if t.get('estado') in ['resuelto', 'cerrado']
        ])
        
        efficiency_ratio = closed_last_30 / assigned_last_30 if assigned_last_30 > 0 else 1.0
        
        # Calcular penalización por gaming
        gaming_penalty = self._calculate_gaming_penalty({
            'avg_ticket_age_days': avg_ticket_age_days,
            'stagnant_count': stagnant_count,
            'resolution_velocity': resolution_velocity,
            'efficiency_ratio': efficiency_ratio
        })
        
        return {
            'active_count': active_count,
            'active_weighted': active_weighted,
            'avg_ticket_age_days': round(avg_ticket_age_days, 2),
            'stagnant_count': stagnant_count,
            'resolution_velocity': round(resolution_velocity, 2),
            'efficiency_ratio': round(efficiency_ratio, 2),
            'gaming_penalty': round(gaming_penalty, 2)
        }
    
    def _is_ticket_recent(self, ticket: Dict, since_date: datetime) -> bool:
        """Verifica si un ticket fue creado después de una fecha"""
        created_at = ticket.get('createdAt')
        if not created_at:
            return False
        
        try:
            if isinstance(created_at, str):
                fecha = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                fecha = created_at
            
            return fecha.replace(tzinfo=None) >= since_date
        except:
            return False
    
    def _calculate_gaming_penalty(self, metrics: Dict) -> float:
        """
        Calcula penalización por comportamiento de gaming
        
        Retorna: Valor entre 0 (sin gaming) y 1000+ (gaming severo)
        """
        penalty = 0.0
        
        # 1. Penalización por Tickets Viejos
        # Si promedio > 3 días, penalizar exponencialmente
        if metrics['avg_ticket_age_days'] > 3:
            penalty += (metrics['avg_ticket_age_days'] - 3) ** 2 * 50
        
        # 2. Penalización por Tickets Estancados
        # Cada ticket sin actualización en 48h = 100 puntos
        penalty += metrics['stagnant_count'] * 100
        
        # 3. Penalización por Baja Velocidad de Resolución
        # Si resuelve < 0.5 tickets/día, penalizar
        if metrics['resolution_velocity'] < 0.5:
            penalty += (0.5 - metrics['resolution_velocity']) * 200
        
        # 4. Penalización por Baja Eficiencia
        # Si eficiencia < 0.7 (cierra menos del 70% de lo asignado)
        if metrics['efficiency_ratio'] < 0.7:
            penalty += (0.7 - metrics['efficiency_ratio']) * 300
        
        return penalty
        
    def calculate_assignment_score(self, agent: Dict, metrics: Dict) -> float:
        """
        Calcula score final para asignación
        
        Mayor score = Mejor candidato
        """
        base_score = 10000
        
        # 1. Penalización por Cantidad (Prioridad #1)
        count_penalty = metrics['active_count'] * 150
        
        # 2. Penalización por Peso de Prioridades
        weight_penalty = metrics['active_weighted'] * 50
        
        # 3. Penalización por Gaming (NUEVO)
        gaming_penalty = metrics['gaming_penalty']
        
        # 4. Bonus por Alta Velocidad de Resolución
        velocity_bonus = metrics['resolution_velocity'] * 100
        
        # 5. Bonus por Alta Eficiencia
        efficiency_bonus = metrics['efficiency_ratio'] * 200
        
        final_score = (
            base_score 
            - count_penalty 
            - weight_penalty 
            - gaming_penalty 
            + velocity_bonus 
            + efficiency_bonus
        )
        
        return final_score
        
    async def assign_ticket(self, ticket: Dict) -> Dict:
        """Asignar el ticket al mejor Resolutor disponible"""
        
        empresa_id = ticket.get('empresaId')
        grupo_atencion = ticket.get('grupo_atencion')
        
        if not empresa_id:
            raise Exception("Ticket no tiene empresaId")
        
        if not grupo_atencion:
            raise Exception("Ticket no tiene grupo_atencion definido")
        
        # 1. Obtener agentes del grupo específico
        agents = await self.get_available_agents(grupo_atencion, empresa_id)
        if not agents:
            raise Exception(f"No hay Resolutores disponibles en el grupo '{grupo_atencion}' para empresaId {empresa_id}")
            
        print(f"📋 Evaluando {len(agents)} Resolutores del grupo '{grupo_atencion}'...")
        
        agent_scores = []
        
        # 2. Calcular Score para cada agente
        for agent in agents:
            agent_id = agent.get('_id') or agent.get('id')
            agent['id'] = agent_id
            
            # Obtener métricas completas (incluyendo anti-gaming)
            metrics = await self.calculate_agent_metrics(agent_id, empresa_id)
            agent['metrics'] = metrics
            
            # Calcular Score
            score = self.calculate_assignment_score(agent, metrics)
            
            agent_scores.append((agent, score))
            
            # Log detallado
            print(f"   👤 {agent.get('nombre')}")
            print(f"      Tickets Activos: {metrics['active_count']} (Peso: {metrics['active_weighted']})")
            print(f"      Edad Promedio: {metrics['avg_ticket_age_days']} días")
            print(f"      Estancados: {metrics['stagnant_count']}")
            print(f"      Velocidad: {metrics['resolution_velocity']} tickets/día")
            print(f"      Eficiencia: {metrics['efficiency_ratio']*100:.0f}%")
            print(f"      Gaming Penalty: {metrics['gaming_penalty']}")
            print(f"      ⭐ Score Final: {score:.2f}")
        
        # 3. Seleccionar Mejor Candidato
        best_agent_tuple = max(agent_scores, key=lambda x: x[1])
        best_agent = best_agent_tuple[0]
        best_score = best_agent_tuple[1]
        
        print(f"\n✅ ASIGNADO A: {best_agent.get('nombre')} (Score: {best_score:.2f})")
        print(f"   Carga Actual: {best_agent['metrics']['active_count']} tickets")
        
        return best_agent