# Algoritmos de Asignación Automática de Tickets - IA Service

## Tabla de Contenidos
1. [Flujo General](#flujo-general)
2. [Obtención de Agentes Candidatos](#obtención-de-agentes-candidatos)
3. [Cálculo de Métricas por Agente](#cálculo-de-métricas-por-agente)
4. [Sistema de Scoring](#sistema-de-scoring)
5. [Detección de Gaming](#detección-de-gaming)
6. [Selección Final](#selección-final)

---

## Flujo General

```python
async def assign_ticket(ticket_data: Dict) -> Dict:
    """
    Punto de entrada principal para asignación automática
    
    Parámetros:
        ticket_data: Diccionario con información del ticket
            - id: ID del ticket
            - empresaId: ID de la empresa
            - servicioId: ID del servicio
            - grupo_atencion: Grupo técnico (ej: "Infraestructura")
    
    Retorna:
        Dict con resultado de asignación o error
    """
```

### Paso 1: Obtener grupo de atención
```python
# Línea 1: Extraer grupo del ticket
grupo = ticket_data.get('grupo_atencion')

# Línea 2-3: Validar que existe
if not grupo:
    return {"error": "No se especificó grupo de atención"}
```

### Paso 2: Buscar agentes candidatos
```python
# Llamar a usuarios-svc para obtener usuarios de la empresa
candidatos = await get_agents_by_group(
    empresa_id=ticket_data['empresaId'],
    grupo=grupo
)

# Filtrar solo agentes activos con roles permitidos
roles_permitidos = ['soporte', 'beca-soporte', 'admin-interno']
candidatos = [c for c in candidatos if c['rol'] in roles_permitidos]
```

---

## Obtención de Agentes Candidatos

```python
async def get_agents_by_group(empresa_id: str, grupo: str) -> List[Dict]:
    """
    Obtiene todos los agentes que pertenecen a un grupo de atención
    
    Proceso:
    1. Consultar usuarios-svc con parámetros de empresa y activo=true
    2. Filtrar localmente por grupo de atención
    3. Filtrar por roles permitidos
    """
    
    # LÍNEA 1: Preparar headers con SERVICE_TOKEN
    headers = {
        'Authorization': f'Bearer {SERVICE_TOKEN}',
        'X-Service-Name': 'ia-svc'
    }
    
    # LÍNEA 2-5: Consultar usuarios de la empresa
    response = await httpx.get(
        f"{USUARIOS_SVC_URL}/usuarios",
        params={'empresa': empresa_id, 'activo': true},
        headers=headers
    )
    
    # LÍNEA 6: Parsear respuesta
    usuarios = response.json().get('data', [])
    
    # LÍNEA 7-15: Filtrar por grupo de atención
    candidatos = []
    for usuario in usuarios:
        # Verificar si el usuario pertenece al grupo
        grupos = usuario.get('gruposDeAtencion', [])
        
        # Soporta tanto array como string
        if isinstance(grupos, list):
            pertenece = grupo in grupos
        else:
            pertenece = grupos == grupo
        
        # Si pertenece, agregarlo a candidatos
        if pertenece:
            candidatos.append(usuario)
    
    return candidatos
```

**Ejemplo:**
```
Entrada: empresa="ABC123", grupo="Infraestructura"
Usuarios en BD: 7 usuarios activos
Filtrado por grupo: 2 usuarios (Gabriel, Patricia)
Resultado: [Gabriel, Patricia]
```

---

## Cálculo de Métricas por Agente

Para cada candidato, se calculan 5 métricas principales:

### 1. Tickets Activos (Carga Actual)

```python
async def get_active_tickets_count(agent_id: str) -> int:
    """
    Cuenta tickets en estados: abierto, en_proceso, en_espera
    
    Proceso línea por línea:
    """
    
    # LÍNEA 1: Definir estados activos
    active_states = ['abierto', 'en_proceso', 'en_espera']
    
    # LÍNEA 2-6: Consultar tickets del agente
    tickets = await httpx.get(
        f"{TICKETS_SVC_URL}/tickets",
        params={'empresaId': empresa_id, 'limite': 1000},
        headers=headers
    )
    
    # LÍNEA 7-12: Filtrar localmente por agente y estado
    agent_tickets = []
    for ticket in tickets.json().get('data', []):
        agente = ticket.get('agenteAsignado')
        
        # Soporta ObjectId string o objeto poblado
        agente_id_ticket = agente if isinstance(agente, str) else agente.get('_id')
        
        # Si coincide el agente Y el estado es activo
        if agente_id_ticket == agent_id and ticket.get('estado') in active_states:
            agent_tickets.append(ticket)
    
    # LÍNEA 13: Retornar conteo
    return len(agent_tickets)
```

**Peso en scoring:** 
- 0 tickets = Score +100
- 1-3 tickets = Score +50
- 4-6 tickets = Score +20
- 7+ tickets = Score +0

### 2. Edad Promedio de Tickets

```python
def calculate_average_age(tickets: List[Dict]) -> float:
    """
    Calcula la edad promedio de tickets activos en días
    
    Fórmula: Σ(edad_ticket) / total_tickets
    """
    
    # LÍNEA 1: Si no hay tickets, edad = 0
    if not tickets:
        return 0.0
    
    # LÍNEA 2: Obtener timestamp actual
    now = datetime.now()
    
    # LÍNEA 3-7: Calcular edad de cada ticket
    ages = []
    for ticket in tickets:
        created = datetime.fromisoformat(ticket['createdAt'])
        age_days = (now - created).total_seconds() / 86400  # Convertir a días
        ages.append(age_days)
    
    # LÍNEA 8: Calcular promedio
    return sum(ages) / len(ages)
```

**Impacto:**
- Edad < 1 día: Buen manejo (+10 puntos)
- Edad 1-3 días: Normal (0 puntos)
- Edad > 3 días: Tickets estancados (-20 puntos)

### 3. Tickets Estancados

```python
def count_stale_tickets(tickets: List[Dict], threshold_days: int = 3) -> int:
    """
    Cuenta tickets sin actualización en X días
    """
    
    # LÍNEA 1-2: Definir tiempo límite
    now = datetime.now()
    threshold = now - timedelta(days=threshold_days)
    
    # LÍNEA 3-8: Contar tickets estancados
    stale_count = 0
    for ticket in tickets:
        last_update = datetime.fromisoformat(ticket['updatedAt'])
        
        # Si no se ha actualizado en threshold_days
        if last_update < threshold:
            stale_count += 1
    
    return stale_count
```

**Penalización:**
- Cada ticket estancado: -15 puntos

### 4. Velocidad de Resolución

```python
async def calculate_resolution_speed(agent_id: str) -> float:
    """
    Tickets resueltos / días del período (últimos 30 días)
    
    Fórmula: tickets_resueltos_30d / 30
    """
    
    # LÍNEA 1-2: Definir período
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # LÍNEA 3-10: Obtener tickets resueltos del agente
    all_tickets = await get_agent_tickets(agent_id, all_states=True)
    
    resolved_tickets = []
    for ticket in all_tickets:
        if ticket['estado'] == 'resuelto':
            resolved_date = datetime.fromisoformat(ticket['fechaResolucion'])
            if resolved_date >= thirty_days_ago:
                resolved_tickets.append(ticket)
    
    # LÍNEA 11: Calcular velocidad
    velocity = len(resolved_tickets) / 30
    
    return velocity
```

**Bonificación:**
- Velocidad > 1.0 tickets/día: +30 puntos
- Velocidad 0.5-1.0: +15 puntos
- Velocidad < 0.5: 0 puntos

### 5. Eficiencia (Ratio Resueltos)

```python
def calculate_efficiency(tickets_history: List[Dict]) -> float:
    """
    Porcentaje de tickets resueltos vs total
    
    Fórmula: (resueltos + cerrados) / total * 100
    """
    
    # LÍNEA 1: Total de tickets históricos
    total = len(tickets_history)
    
    # LÍNEA 2: Si no hay historial, eficiencia = 100%
    if total == 0:
        return 100.0
    
    # LÍNEA 3-7: Contar tickets completados
    completed = 0
    for ticket in tickets_history:
        if ticket['estado'] in ['resuelto', 'cerrado']:
            completed += 1
    
    # LÍNEA 8: Calcular porcentaje
    efficiency = (completed / total) * 100
    
    return efficiency
```

**Impacto:**
- Eficiencia >= 90%: Sin penalización
- Eficiencia 70-89%: -10 puntos
- Eficiencia < 70%: -25 puntos

---

## Sistema de Scoring

### Fórmula Base

```python
def calculate_agent_score(metrics: Dict) -> float:
    """
    Calcula score final del agente
    
    Componentes:
    1. Carga actual (peso negativo)
    2. Edad promedio (penalización por estancamiento)
    3. Velocidad (bonificación)
    4. Eficiencia (multiplicador)
    5. Gaming penalty (detector de manipulación)
    """
    
    # LÍNEA 1: Score base
    score = 100.0
    
    # LÍNEA 2-5: PENALIZACIÓN POR CARGA
    # A más tickets activos, menor score
    active_count = metrics['active_count']
    active_weighted = active_count * 10  # Cada ticket pesa 10 puntos
    score -= active_weighted
    
    # LÍNEA 6-9: PENALIZACIÓN POR EDAD
    # Tickets viejos indican mala gestión
    avg_age = metrics['average_age']
    if avg_age > 3:
        age_penalty = (avg_age - 3) * 5
        score -= age_penalty
    
    # LÍNEA 10-13: PENALIZACIÓN POR ESTANCADOS
    stale = metrics['stale_count']
    score -= (stale * 15)
    
    # LÍNEA 14-19: BONIFICACIÓN POR VELOCIDAD
    velocity = metrics['velocity']
    if velocity >= 1.0:
        score += 30
    elif velocity >= 0.5:
        score += 15
    
    # LÍNEA 20-26: MULTIPLICADOR DE EFICIENCIA
    efficiency = metrics['efficiency']
    if efficiency >= 90:
        efficiency_multiplier = 1.0
    elif efficiency >= 70:
        efficiency_multiplier = 0.9
        score -= 10
    else:
        efficiency_multiplier = 0.8
        score -= 25
    
    # LÍNEA 27: Aplicar multiplicador
    score *= efficiency_multiplier
    
    # LÍNEA 28: Aplicar gaming penalty
    score *= metrics['gaming_penalty']
    
    # LÍNEA 29: Score final (mínimo 0)
    return max(0, score)
```

### Ejemplo de Cálculo

**Agente: Gabriel**
```
Métricas:
- Tickets activos: 2
- Edad promedio: 1.5 días
- Estancados: 0
- Velocidad: 0.8 tickets/día
- Eficiencia: 85%
- Gaming penalty: 1.0 (sin manipulación)

Cálculo:
Score base:              100.0
- Carga (2 * 10):        -20.0
- Edad (OK):              -0.0
- Estancados (0):         -0.0
+ Velocidad (0.5-1.0):   +15.0
- Eficiencia (70-89%):   -10.0
= Subtotal:               85.0
* Eficiencia mult (0.9):  76.5
* Gaming penalty (1.0):   76.5

SCORE FINAL: 76.5
```

---

## Detección de Gaming

Sistema anti-manipulación que detecta comportamientos sospechosos:

```python
def detect_gaming(agent_id: str, tickets_history: List[Dict]) -> float:
    """
    Detecta si un agente está manipulando el sistema
    
    Retorna: Penalización (0.0 - 1.0)
    - 1.0 = Sin manipulación
    - 0.5 = Sospechoso
    - 0.0 = Gaming detectado
    """
    
    # LÍNEA 1-3: Analizar patrones de cierre
    recent_closed = []
    for ticket in tickets_history:
        if ticket['estado'] == 'cerrado':
            duration = ticket.get('tiempoResolucion', 0)
            recent_closed.append(duration)
    
    # LÍNEA 4-7: DETECTOR 1 - Cierres instantáneos
    # Tickets cerrados muy rápido pueden indicar gaming
    instant_closes = sum(1 for d in recent_closed if d < 300)  # < 5 minutos
    
    if instant_closes > 5:
        penalty = 0.5  # 50% de penalización
        print(f"⚠️ GAMING DETECTADO: {instant_closes} cierres instantáneos")
        return penalty
    
    # LÍNEA 8-12: DETECTOR 2 - Selectividad de tickets
    # Aceptar solo tickets fáciles
    easy_tickets = sum(1 for t in tickets_history if t.get('prioridad') == 'baja')
    total = len(tickets_history)
    
    if total > 10 and (easy_tickets / total) > 0.8:
        penalty = 0.7  # 30% de penalización
        print(f"⚠️ POSIBLE GAMING: {(easy_tickets/total)*100}% tickets fáciles")
        return penalty
    
    # LÍNEA 13-17: DETECTOR 3 - Transferencias excesivas
    # Transferir tickets difíciles a otros
    transfers = sum(1 for t in tickets_history if 'transfer_history' in t)
    
    if transfers > 5 and (transfers / total) > 0.3:
        penalty = 0.6  # 40% de penalización
        print(f"⚠️ GAMING: Transferencias excesivas ({transfers})")
        return penalty
    
    # LÍNEA 18: Sin gaming detectado
    return 1.0
```

---

## Selección Final

```python
async def select_best_agent(candidates: List[Dict]) -> Dict:
    """
    Selecciona el mejor agente basado en scores
    
    Proceso:
    1. Calcular métricas para cada candidato
    2. Calcular scores
    3. Ordenar por score descendente
    4. Seleccionar el primero
    5. Balancear en caso de empate
    """
    
    # LÍNEA 1-10: Calcular scores
    scored_agents = []
    for candidate in candidates:
        metrics = await calculate_metrics(candidate['_id'])
        score = calculate_agent_score(metrics)
        
        scored_agents.append({
            'agent': candidate,
            'score': score,
            'metrics': metrics
        })
    
    # LÍNEA 11: Ordenar por score (mayor primero)
    scored_agents.sort(key=lambda x: x['score'], reverse=True)
    
    # LÍNEA 12-16: Manejo de empates
    best_score = scored_agents[0]['score']
    tied_agents = [a for a in scored_agents if a['score'] == best_score]
    
    if len(tied_agents) > 1:
        # En caso de empate, usar round-robin o último asignado
        selected = select_least_recently_assigned(tied_agents)
    else:
        selected = scored_agents[0]
    
    # LÍNEA 17: Logging
    print(f"✅ ASIGNADO A: {selected['agent']['nombre']}")
    print(f"   Score: {selected['score']}")
    print(f"   Carga actual: {selected['metrics']['active_count']} tickets")
    
    # LÍNEA 18: Retornar agente seleccionado
    return selected['agent']
```

---

## Resumen de Prioridades

El algoritmo prioriza en este orden:

1. **Disponibilidad** (Carga actual baja) - Peso: 40%
2. **Eficiencia** (Alto ratio de resolución) - Peso: 25%
3. **Velocidad** (Resolución rápida) - Peso: 20%
4. **Prevención de estancamiento** - Peso: 10%
5. **Anti-gaming** - Peso: 5%

### Casos Especiales

**Agente con 0 tickets siempre gana:**
```python
if active_count == 0:
    score = 10000  # Score muy alto garantiza selección
```

**Todos los agentes sobrecargados:**
```python
# Si todos tienen > 5 tickets activos
# Se selecciona el de menor carga de todas formas
# Pero se registra alerta
if min_score < 20:
    print("⚠️ ALERTA: Todos los agentes sobrecargados")
```

**Sin candidatos disponibles:**
```python
if len(candidates) == 0:
    # Ticket queda sin asignar
    # Se envía notificación a admins
    notify_admins("Sin agentes disponibles para grupo X")
```
